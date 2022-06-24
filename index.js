
const fs = require('fs');
const http = require('http');

const MIME_TABLE = [
    {"html":"text/html"},
    {"css":"text/css"},
    {"js":"text/javascript"},
    {"svg":"image/svg+xml"},
    {"png":"image/png"},
    {"jpg":"image/jpeg"},
    {"jpeg":"image/jpeg"},
    {"ttf":"application/x-font-ttf"},
    {"otf":"application/x-font-opentype"}
]

function getLastExtension( fullpath ){
    let lastIdx = -1;
    for(let i = 0; i < fullpath.length; i++){
        if( fullpath.charAt(i) === '.' ){
            lastIdx = i;
        }
    }

    if( lastIdx < 0 ){
        return fullpath;
    }

    return fullpath.substring( lastIdx + 1 );
}

function getMIME( url ){
    let target = 'text/text';
    MIME_TABLE.forEach( mime => {
        let list = mime[ getLastExtension( url ) ];
        if( list != undefined ){
            target = list;
        }
    });
    return target;
}

http.createServer((req,res) => {
    let resPath = '';
    req.url === '/' ? resPath = '/index.html' : resPath = req.url;
    
    let mime = getMIME( resPath );

    res.writeHead( 200,{ 'Content-Type': mime,'Access-Control-Allow-Origin':'*' });
    try{
        res.end(fs.readFileSync( '.' + resPath));
    }catch(err){
        console.log(err);
    }
    
}).listen(8080);