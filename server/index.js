
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

function serverHandler( req, res ){
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

    /* 해당 URL로 네이버 OAuth2 인증 요청을 보내면 /auth/naver/callback URI로 응답 */
    if( req.url.startsWith('/oauth2/authorization/naver') ){
        res.writeHead(302, {
			'Location': 'https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=' + process.env.NAVER_RESTAPI_KEY + '&redirect_uri=http://www.metroinder.co.kr/auth/naver/callback&state=test'
        });
        res.end()
		return;
    }

    /* 해당 URL로 구글 OAuth2 인증 요청을 보내면 /auth/google/callback URI로 응답 */
    if( req.url.startsWith('/oauth2/authorization/google') ){
        res.writeHead(302, {
			'Location': 'https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=' + process.env.GOGLE_RESTAPI_KEY + '&redirect_uri=http://www.metroinder.co.kr/auth/google/callback&scope=https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email&include_granted_scopes=true&access_type=offline'
        });
        res.end()
		return;
    }
	
    /* 구글 OAuth2 인증 요청 응답 처리 */
    if( req.url.startsWith('/auth/google/callback') ){
        let param = parseGetParam( req.url );
        res.writeHead(200, {'Content-Type':'text/html'});

        /* 헤더에서 네이버 OAuth2 인가 코드를 받아오면 해당 인가 코드를 다시 백앤드 서버로 전송 */
        let greq = http.get('http://' + process.env.BACKEND_HOST + '/loginMetroinder?code=' + param.code + '&provider=google', (rsp) => {
            let body = '';
            rsp.on('data', (chunk) => {
                body += chunk;
            });
            rsp.on('end', () => {
                let data = JSON.parse(body);
                let auth = rsp.headers['authorization'];
                let aref = rsp.headers['authorization-refresh'];

                let queryStr = '<script>window.close();';
                queryStr += 'localStorage.setItem("login_user", "' + data.UserName + '");';
                queryStr += 'localStorage.setItem("login_email", "' + data.email + '");';
                queryStr += 'localStorage.setItem("auth", "' + auth + '");';
                queryStr += 'localStorage.setItem("auth-ref", "' + aref + '");';
                queryStr += '</script>';

                res.end(queryStr);
            });
        });

        /* 로그인 서버와 연결 실패 시, 클라이언트 오류 처리 */
        greq.on('error', (err) => {
            console.log('[오류]: 로그인 인증 서버(' + process.env.BACKEND_HOST + ')에 접속할 수 없습니다!');
            res.end('<head><meta charset="utf-8"></head><body><script>alert("로그인 인증 서버 연결 실패"); window.close();</script></body>');
        });

        return;
    }

    /* 네이버 OAuth2 인증 요청 응답 처리 */
    if( req.url.startsWith('/auth/naver/callback') ){
        let param = parseGetParam( req.url );
        res.writeHead(200, {'Content-Type':'text/html'});

        /* 헤더에서 네이버 OAuth2 인가 코드를 받아오면 해당 인가 코드를 다시 백앤드 서버로 전송 */
        let greq = http.get('http://' + process.env.BACKEND_HOST + '/loginMetroinder?code=' + param.code + '&provider=naver', (rsp) => {
            let body = '';
            rsp.on('data', (chunk) => {
                body += chunk;
            });
            rsp.on('end', () => {
                let data = JSON.parse(body);
                let auth = rsp.headers['authorization'];
                let aref = rsp.headers['authorization-refresh'];

                let queryStr = '<script>window.close();';
                queryStr += 'localStorage.setItem("login_user", "' + data.UserName + '");';
                queryStr += 'localStorage.setItem("login_email", "' + data.email + '");';
                queryStr += 'localStorage.setItem("auth", "' + auth + '");';
                queryStr += 'localStorage.setItem("auth-ref", "' + aref + '");';
                queryStr += '</script>';

                res.end(queryStr);
            });
        });

        /* 로그인 서버와 연결 실패 시, 클라이언트 오류 처리 */
        greq.on('error', (err) => {
            console.log('[오류]: 로그인 인증 서버(' + process.env.BACKEND_HOST + ')에 접속할 수 없습니다!');
            res.end('<head><meta charset="utf-8"></head><body><script>alert("로그인 인증 서버 연결 실패"); window.close();</script></body>');
        });

        return;
    }

	/* 카카오 OAuth2 인증 요청 응답 처리 */
	if( req.url.startsWith('/auth/kakao/callback') ){
		let param = parseGetParam( req.url );
        res.writeHead(200, {'Content-Type':'text/html'});

		/* 헤더에서 카카오 OAuth2 인가 코드를 받아오면 해당 인가 코드를 다시 백앤드 서버로 전송 */
        let greq = http.get('http://' + process.env.BACKEND_HOST + '/loginMetroinder?code=' + param.code + '&provider=kakao', (rsp) => {
            let body = '';
            rsp.on('data', (chunk) => {
                body += chunk;
            });
            rsp.on('end', () => {
                let data = JSON.parse(body);
                let auth = rsp.headers['authorization'];
                let aref = rsp.headers['authorization-refresh'];

                let queryStr = '<script>window.close();';
                queryStr += 'localStorage.setItem("login_user", "' + data.UserName + '");';
                queryStr += 'localStorage.setItem("login_email", "' + data.email + '");';
                queryStr += 'localStorage.setItem("auth", "' + auth + '");';
                queryStr += 'localStorage.setItem("auth-ref", "' + aref + '");';
                queryStr += '</script>';

                res.end(queryStr);
            });
        });

        /* 로그인 서버와 연결 실패 시, 클라이언트 오류 처리 */
        greq.on('error', (err) => {
            console.log('[오류]: 로그인 인증 서버(' + process.env.BACKEND_HOST + ')에 접속할 수 없습니다!');
            res.end('<head><meta charset="utf-8"></head><body><script>alert("로그인 인증 서버 연결 실패"); window.close();</script></body>');
        });

        return;
	}

    if( req.url.startsWith('/validationAccessToken') ){
        let auth = req.headers['authorization'];
        let greq = http.get('http://' + process.env.BACKEND_HOST + '/validationAccess', {headers: {'Authorization':'Bearer ' + auth}}, (rsp) => {});
        greq.on('error', (err) => { console.log('[오류]: 로그인 인증 서버(' + process.env.BACKEND_HOST + ')에 접속할 수 없습니다!'); });

        res.writeHead(200);
        res.end();
        return;
    }

    if( req.url.startsWith('/getNews') ){
        https.get('https://news.google.com/rss/search?q=%EC%A7%80%ED%95%98%EC%B2%A0+when:1d&hl=en-US&gl=US&ceid=US:en', (rsp) => {
            let body = '';
            rsp.on('data', (chunk) => {
                body += chunk;
            });
            rsp.on('end', () => {
                res.writeHead(200);
                res.end(body);
            });
        });
        return;
    }

    if( req.url.startsWith('/returnPeopleCount') ){
        /*http.request({ host: 'localhost', port: 8090, method: 'GET', path: req.url },(res_sub) => {
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
        }).end();*/
        res.writeHead(200);
        res.end('[]');
        return;
    }

	if( req.url.startsWith('/api/realtime/station') ){
		/*http.request({ host: 'localhost', port: 8090, method: 'GET', path: req.url },(res_sub) => {
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
        }).end();*/
        res.writeHead(200);
        res.end('[]');
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
}

/*
* 설명 : 암호화된 HTTPS 기반 통신으로 접속한 클라이언트 요청을 처리하기 위한 함수
* 작성일 : 2024-01-19
* 작성자 : RichardCYang
* 인자값1 : KEY_CERT => 인증서 키 정보(.pem)
* 인자값2 : (req, res) => 클라이언트 요청 시, 호출 되는 콜백 함수
*/
https.createServer(KEY_CERT, (req,res) => {
    serverHandler(req, res);
}).listen(8060);

/*
* 설명 : 암호화 하지 않은 HTTP 기반 통신으로 접속한 클라이언트 요청을 처리하기 위한 함수
* 작성일 : 2024-01-19
* 작성자 : RichardCYang
* 인자값 : (req, res) => 클라이언트 요청 시, 호출 되는 콜백 함수
*/
http.createServer((req, res) => {
    serverHandler(req, res);
}).listen(8070);