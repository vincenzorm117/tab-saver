
const folderName = 'Sputnik';

/**
 * @description Finds BookmarkTreeNode matching criteria.
 * @returns Single BookmarkTreeNode matching test criteria otherwise null.
 * @param {BookmarkTreeNode} root Root node to search. https://developer.chrome.com/extensions/bookmarks#type-BookmarkTreeNode.
 * @param {Function} test returns boolean based on search criteria
 */
const searchTree = (root, test) => {
    let queue = [root];
    while( 0 < queue.length ) {
        let current = queue.shift();
        if( test(current) ) {
            return current;
        }
        if( Array.isArray(current.children) ) {
            queue.push(...current.children)
        }
    }
    return null;
}

/**
 * @returns BookmarkTreeNode of folder to store all instances of saved tabs.
 * @description Gets folder to store tabs to save.
 */
const GetFolder = () => {
    return new Promise((resolve, reject) => {
        // Get folder info from localstorage if it exists
        try {
            let folder = JSON.parse(window.localStorage.getItem('folder'));
            if( folder != null ) {
                resolve(folder)
                return;
            }
        } catch(_) {}
        // Find or create folder
        try {
            chrome.bookmarks.getTree(([root]) => {
                let folder = searchTree(root, node => node.parentId == '2' && node.title == folderName)
                if( folder == null ) {
                    chrome.bookmarks.create({
                        parentId: '2',
                        title: folderName
                    }, resolve)
                } else {
                    resolve(folder);
                }
            });
        } catch(error) {
            reject(error)
        }
    })
}

/**
 * @returns String of formatted datetime.
 */
const formattedDate = () => {
    let dateObject = new Date(),
        date  = dateObject.getDate(),
        month = dateObject.getMonth() + 1,
        year  = dateObject.getFullYear(),
        hours = dateObject.getHours() % 12,
        mins  = dateObject.getMinutes(),
        secs  = dateObject.getSeconds();
    if( date < 10 ) date = '0' + date;
    if( month < 10 ) month = '0' + month;
    if( hours < 10 ) hours = '0' + hours;
    if( mins < 10 ) mins = '0' + mins;
    if( secs < 10 ) secs = '0' + secs;
    return `${date}-${month}-${year}--${hours}:${mins}:${secs}`;
}

chrome.runtime.onMessage.addListener(({ type }) => {
    if( type == 'save' ) {
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
            GetFolder().then(rootFolder => {
                window.localStorage.setItem('folder', JSON.stringify(rootFolder));
                chrome.bookmarks.create({
                    parentId: rootFolder.id,
                    title: `Saved - ${formattedDate()}`
                }, (folder) => {
                    for(let tab of tabs) {
                        chrome.bookmarks.create({
                            parentId: folder.id,
                            title: tab.title,
                            index: tab.index,
                            url: tab.url
                        }, () => {})
                    }
                });
            });
        });
    } else {
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
            tabs.map(tab => chrome.tabs.remove(tab.id))
        });
    }
});

