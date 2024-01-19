
const fs = require('fs');
const http = require('http');
const https = require('https');

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

/*
* 설명 : 예기치 못한 예외 발생으로 인해 서버 프로그램이 종료되는 일이 발생하지 못하도록 처리
* 작성일 : 2024-01-19
* 작성자 : RichardCYang
*/
process.on('uncaughtException', (err) => {console.log(err)});

/*
* 설명 : .env 환경 설정 파일에서 관련 설정 정보 파싱하는 코드
* 작성일 : 2024-01-15
* 작성자 : RichardCYang
*/
if(fs.existsSync('.env')){
	let envFile = fs.readFileSync('.env');
	envFile = envFile.toString();

	let lines = envFile.split('\n');
	for(let i = 0; i < lines.length; i++){
		let token = lines[i].split('=');
		if(token.length > 1){
			let key = token[0].trim();
			let val = token[1].replaceAll("'", '').trim();
			process.env[key] = val;
		}
	}
}

let KEY_CERT = null;

if( fs.existsSync(process.env.HTTPS_KEYPEM) && fs.existsSync(process.env.HTTPS_CHNPEM) ){
    KEY_CERT = {key:fs.readFileSync(process.env.HTTPS_KEYPEM), cert:fs.readFileSync(process.env.HTTPS_CHNPEM)};
}

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

/*
* 설명 : GET 요청 URL에서 인자값을 파싱하는 함수
* 작성일 : 2024-01-15
* 작성자 : RichardCYang
* 인자값 : url = 인자값을 파싱할 대상 전체 GET 요청 URL 문자열
*/
function parseGetParam( url ){
    let token = url.split('?');
    let keyval = {}

    if( token.length > 1){
        let queryStr = token[1];
        let queryToken = queryStr.split('&');

        for(let i = 0; i < queryToken.length; i++){
                let kvToken = queryToken[i].split('=');
                keyval[kvToken[0]] = kvToken[1];
        }
    }

    return keyval;
}

https.createServer(KEY_CERT, (req,res) => {
    let resPath = '';
    req.url === '/' ? resPath = '../client/src/index.html' : resPath = '../client' + req.url;
	
	/* 해당 URL로 카카오 OAuth2 인증 요청을 보내면 /auth/kakao/callback URI로 응답 */
    if( req.url.startsWith('/oauth2/authorization/kakao') ){
		res.writeHead(302, {
			'Location': 'https://kauth.kakao.com/oauth/authorize?client_id=' + process.env.KAKAO_RESTAPI_KEY + '&response_type=code&redirect_uri=http://www.metroinder.co.kr/auth/kakao/callback'
        });
        res.end()
		return;
    }
	
	/* 카카오 OAuth2 인증 요청 응답 처리 */
	if( req.url.startsWith('/auth/kakao/callback') ){
		let param = parseGetParam( req.url );
        res.writeHead(200);
        res.end();

		/* 헤더에서 카카오 OAuth2 인가 코드를 받아오면 해당 인가 코드를 다시 백앤드 서버로 전송 */
        let code = param.code;
        http.get('http://' + process.env.BACKEND_HOST + '/loginMetroinder?code=' + param.code + '&provider=kakao', (res) => {});

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