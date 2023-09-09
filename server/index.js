
const fs = require('fs');
// const https = require('https');
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
// const KEY_CERT = {key:fs.readFileSync('/etc/letsencrypt/live/metroinder.co.kr/privkey.pem'), cert:fs.readFileSync('/etc/letsencrypt/live/metroinder.co.kr/fullchain.pem')};

// process.on('uncaughtException',(err) => {console.log(err)});

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

 http.createServer(/*KEY_CERT,*/ (req,res) => {
    let resPath = '';
    req.url === '/' ? resPath = '../client/src/index.html' : resPath = '../client' + req.url;
	
    if( req.url.startsWith('/login/oauth2/code/kakao') ){
		let code = req.url.split(/code=(.*?)&/g);

		if( code.length > 0 ){
			
		}

		res.writeHead(200);
		res.end();
		return;
    }

    if( req.url.startsWith('/returnPeopleCount') ){
        http.request({ host: 'localhost', port: 8090, method: 'GET', path: req.url },(res_sub) => {
            let data = '';
            res_sub.on('data',(chunk) => {
                data = data + chunk.toString('utf-8');
            });
            res_sub.on('end',() => {
                if( res.statusCode == 200 ){
                    res.writeHead(200, {'Content-Type':'application/json'});
                    res.end(data);
                }else{
                    res.writeHead(200);
                    res.end('[]');
                }
            });
        }).end();
        return;
    }

	if( req.url.startsWith('/api/realtime/station') ){
		http.request({ host: 'localhost', port: 8090, method: 'GET', path: req.url },(res_sub) => {
    	let data = '';
       	res_sub.on('data',(chunk) => {
       		data = data + chunk.toString('utf-8');
       	});
      	res_sub.on('end',() => {
      		if( res.statusCode == 200 ){
            		res.writeHead(200, {'Content-Type':'application/json'});
           			res.end(data);
           		}else{
              		res.writeHead(200);
              		res.end('[]');
      			}
        	});
        }).end();
		return;
	}

    resPath = decodeURI( decodeURIComponent( resPath ) );
    
    let mime = getMIME( resPath );

    res.writeHead( 200,{ 'Content-Type': mime,'Access-Control-Allow-Origin':'*' });
    fs.readFile(resPath, (err, data) => {
        if( err ){
            console.log(err);
            res.end('');
            return;
        }

        res.end(data);
    });
}).listen(8070);

http.createServer((req,res) => {
   //res.writeHead(302, {'Location':'https://metroinder.co.kr'});
   //res.end();
}).listen(8090);
