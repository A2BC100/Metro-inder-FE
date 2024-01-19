
window.curUserName = 'MrDB';

function deflateSide(){
    document.querySelector('.information_box').style.transform = 'translateX(-494px)';
    document.querySelector('.information_but').style.left = '0px';
    document.querySelector('.information_but').style.background = 'url(../resources/imges/infobut_right.svg) no-repeat';
}

function inflateSide(){
    document.querySelector('.information_box').style.transform = 'translateX(0px)';
    document.querySelector('.information_but').style.left = '494px';
    document.querySelector('.information_but').style.background = 'url(../resources/imges/infobut_left.svg) no-repeat';
}

function onOAuthClick( service ){
    let left = (window.innerWidth * 0.5) - 240;
    let top = (window.innerHeight * 0.5) - 320;
    let option = 'left=' + left + ',top=' + top + ', width=480, height=640, resizable=no, scrollbars=no, status=no;';
	window.open('http://www.metroinder.co.kr/oauth2/authorization/' + service,"", option);
}

function onToggleInfoBox(){
    window.isExpend = !window.isExpend;
    if( window.isExpend )
        deflateSide();
    else
        inflateSide();
}

function onLoginClick(){
    //document.querySelector('.log_box1').style.display = 'none';
    //document.querySelector('.log_box2').style.display = 'block';
    //document.querySelector('.log_box2 strong').textContent = window.curUserName + '님';
    document.querySelector('.login_form').style.display = 'block';
}

function onCancelLoginClick(){
    document.querySelector('.login_form').style.display = 'none';
}

async function onGPSClick(){
    let coords = await getCurrentLocation();

    if( window.map ){
        window.map.setCenter(new kakao.maps.LatLng(coords.latitude, coords.longitude));
        window.map.setLevel(3);
    }
}

function onMapTypeToggle(){
    if( !window.map )
        return;
    this.mapTypeState = !this.mapTypeState;

    if( !mapTypeState ){
        window.map.setMapTypeId(kakao.maps.MapTypeId.ROADMAP);
        document.querySelector('.mt_but').style.background = 'url(../resources/imges/Globe.svg) no-repeat';
    }else{
        window.map.setMapTypeId(kakao.maps.MapTypeId.HYBRID);
        document.querySelector('.mt_but').style.background = 'url(../resources/imges/map.svg) no-repeat';
    }
}

function getCurrentLocation(){
    return new Promise((res) => {
        navigator.geolocation.getCurrentPosition((pos) => {
            res(pos.coords);
        }, (err) => {
            let coords = [];
            coords.latitude = 33.450701;
            coords.longitude = 126.570667;
            res(coords);
        });
    });
}

/*
* 설명 : OpenStreetMap API를 통해 위경도를 주소명으로 변환하는 리버스 지오코딩 함수
* 작성일 : 2024-01-18
* 작성자 : RichardCYang
* 인자값1 : lat => 주소명으로 변환할 위치 위도
* 인자값2 : lon => 주소명으로 변환할 위치 경도
* 인자값3 : onComp => 지오코딩 변환 완료 시, 호출되는 콜백 함수
*/
function getAddressFromLatLon( lat, lon, onComp ){
    return new Promise((res) => {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lon + '&format=json', true);
        xhr.send();
        xhr.onreadystatechange = () => {
            if(xhr.readyState == 4 && xhr.status == 200){
                if(onComp)
                    onComp(JSON.parse(xhr.responseText));
            }
        };
    })
}

/*
* 설명 : OpenMeteo API를 통해 날씨 정보(현재 기온, 최고/최저 기온, 습도, 강수 확률)를 받아오는 함수
* 작성일 : 2024-01-18
* 작성자 : RichardCYang
* 인자값1 : lat => 날씨 정보를 받아올 대상 위치 위도
* 인자값2 : lon => 날씨 정보를 받아올 대상 위치 경도
* 인자값3 : onComp => 날씨 정보 요청 완료 시, 호출되는 콜백 함수
*/
function getWeatherFromLatLon( lat, lon, onComp ){
    let xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,precipitation,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo&forecast_days=1', true);
    xhr.send();
    xhr.onreadystatechange = () => {
        if(xhr.readyState == 4 && xhr.status == 200){
            if(onComp)
                onComp(JSON.parse(xhr.responseText));
        }
    }
}

/*
* 설명 : OpenMeteo API를 통해 대기질 정보(미세먼지, 초미세먼지)를 받아오는 함수
* 작성일 : 2024-01-19
* 작성자 : RichardCYang
* 인자값1 : lat = 대기질 정보를 받아올 대상 위치 위도
* 인자값2 : lon = 대기질 정보를 받아올 대상 위치 경도
* 인자값3 : onComp => 대기질 정보 요청 완료 시, 호출되는 콜백 함수
*/
function getAirQualityFromLatLon( lat, lon, onComp ){
    let xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=' + lat + '&longitude=' + lon + '&current=pm10,pm2_5&domains=cams_global', true);
    xhr.send();
    xhr.onreadystatechange = () => {
        if(xhr.readyState == 4 && xhr.status == 200){
            if(onComp)
                onComp(JSON.parse(xhr.responseText));
        }
    }
}

function searchPlaces( keyword ){
    let places = new kakao.maps.services.Places();

    return new Promise ((res) => {
        places.keywordSearch( keyword, (result, status) => {
            if( status == kakao.maps.services.Status.OK ){
                res( result );
            }
        });
    });
}

function genRandArr( maxlimit, arrcnt ){
    let randarr = new Array;
    
    for(let i = 0; i < arrcnt; i++)
        randarr.push( Math.round( Math.random() * maxlimit ) );

    return randarr;
}

function drawLineBox( canv, color, name ){
    if( !canv )
        return;

    let ctx = canv.getContext('2d');
    // 기존 화면 지우기
    ctx.clearRect(0,0,canv.width,canv.height);
    // 좌우측 직선 그리기
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    ctx.moveTo(10,40);
    ctx.lineTo(128,40);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo( canv.width - 128, 40 );
    ctx.lineTo( canv.width - 10, 40 );
    ctx.stroke();

    // 곡선 구간 그리기
    ctx.beginPath();
    ctx.arc( 158, 40, 28, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();

    // 곡선 구간 그리기
    ctx.beginPath();
    ctx.arc( canv.width - 158, 40, 28, Math.PI * -0.5, Math.PI * -1.5);
    ctx.stroke();

    // 블록 직선 그리기
    ctx.beginPath();
    ctx.moveTo( 158, 12 );
    ctx.lineTo( canv.width - 158, 12 );
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo( 158, 68 );
    ctx.lineTo( canv.width - 158, 68 );
    ctx.stroke();

    // 역명 그리기
    if( name ){
        ctx.font = '20px Arial';
        ctx.fillText( name, (canv.width * 0.5) - (10 * name.length), (canv.height * 0.5) - 12 );
    }
}

function drawTimeBox( canv,arr ){
    if( !canv )
        return;
    if( !arr )
        return;
        
    let base_y = canv.clientHeight - 64;

    let ctx = canv.getContext('2d');
    // 기존 화면 지우기
    ctx.clearRect(0,0,canv.width,canv.height);
    // 기준 선 그리기
    ctx.strokeStyle = '#A8A8A8';
    ctx.moveTo(0,base_y);
    ctx.lineTo(1024,base_y);
    ctx.stroke();

    ctx.font = '12px arial';
    ctx.fillStyle = 'gray';

    let prvX, prvY;
    let gap = 43;

    for(let i = 0; i < 19; i++){
        if( !arr[i + 5] )
            continue;

        let h_rate = (arr[i + 5] / 100) * 180;

        if( prvX && prvY ){
            ctx.moveTo( prvX, prvY );
            ctx.lineTo( 8 + (i * gap) + 5, (base_y - 8) - h_rate );
            ctx.stroke();
        }

        ctx.fillText((i + 5) + '', 8 + (i * gap), base_y + 18);
        ctx.beginPath();
        ctx.strokeStyle = '#62cdf9';
        ctx.arc(8 + (i * gap) + 6, (base_y - 8) - h_rate, 2.5, 0, 2 * Math.PI);
        ctx.stroke();

        prvX = 8 + (i * gap) + 8;
        prvY = (base_y - 8) - h_rate;
    }
}

function getLineColorFromDB( line_name ){
    let xhr = new XMLHttpRequest();
    xhr.open('GET', '/db/metro_colors.json', false); 
    xhr.send();

    line_name = line_name.trim();

    let tbl = JSON.parse( xhr.responseText );
    if( line_name == '수인분당선' )
        return tbl['KR'][0]['2'];
    if( new RegExp('수도권[0-9]호선').test( line_name ) )
        return tbl['SM'][0][ line_name.match(/[0-9]/g)[0] ];
}

function getPeopleCount( station_name ){
    return new Promise((res,rej) => {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', '/returnPeopleCount?stationName=' + station_name, true);
        xhr.send();
        
        xhr.onreadystatechange = () => {
            if( xhr.readyState == XMLHttpRequest.DONE )
                res(JSON.parse( xhr.responseText ));
        }
    });
}

function getRealtimeStation( station_name ){
	return new Promise((res,rej) => {
        let xhr = new XMLHttpRequest();
	    xhr.open('GET', '/api/realtime/station?stationName=' + station_name, true);
	    xhr.send();
        
        xhr.onreadystatechange = () => {
            if( xhr.readyState == XMLHttpRequest.DONE ){
                let obj = JSON.parse( xhr.responseText );
	            res( obj ? obj.realtimeArrivalList ? obj.realtimeArrivalList : new Array : new Array );
            }
        }
    });
}

/*
* 설명 : 숫자로 들어오는 요일 인덱스를 문자열 요일로 변경하는 함수
* 작성일 : 2024-01-18
* 작성자 : RichardCYang
* 인자값 : days = 요일 인덱스
*/
function toStringDay( days ){
    switch(days){
        case 0:
            return "일";
        case 1:
            return "월";
        case 2:
            return "화";
        case 3:
            return "수";
        case 4:
            return "목";
        case 5:
            return "금";
        case 6:
            return "토";
    }
    return "일";
}

/*
* 설명 : 날씨 종류 코드(WMO)를 아이콘 이름으로 변환하는 함수
* 작성일 : 2024-01-19
* 작성자 : RichardCYang
* 인자값 : wmoCode = 날씨 종류 코드(WMO)
*/
function weatherCodeToIconName( wmoCode ){
    switch(wmoCode){
        // 날씨 종류 코드(WMO) : 맑음
        case 0:
            return 'sunny.png';
        // 날씨 종류 코드(WMO) : 구름 많음
        case 1:
        case 2:
            return 'littlecloudy.png';
        // 날씨 종류 코드(WMO) : 흐림
        case 3:
            return 'cloudy.png';
        // 날씨 종류 코드(WMO) : 비
        case 61:
        case 63:
        case 65:
        case 66:
        case 67:
            return 'rainy.png';
        // 날씨 종류 코드(WMO) : 뇌우
        case 95:
        case 96:
        case 99:
            return 'thunder.png';
    }
    return 'sunny.png';
}

window.onload = async() => {
    let container = document.querySelector('.map_img');
    let coords = await getCurrentLocation();

    getWeatherFromLatLon(coords.latitude, coords.longitude, (data) => {
        // OpenMeteo API를 이용하여 날씨(최대 기온, 최소 기온, 습도, 강수확률, 현재 기온) 정보를 가져와서 표시하는 코드
        document.querySelector('.minMaxTemp').textContent = data.daily.temperature_2m_max[0] + '℃ / ' + data.daily.temperature_2m_min[0] + '℃';
        document.querySelector('.curTemp').textContent = data.current.temperature_2m + '℃';
        document.querySelector('.precipitation_humidity').textContent = '강수확률 : ' + data.current.precipitation + '%' + ' ' + '습도 : ' + data.current.relative_humidity_2m + '%';

        let iconName = weatherCodeToIconName(data.current.weather_code);
        let weatherIcon = '../resources/imges/' + iconName;
        
        document.querySelector('.weather_img').src = weatherIcon;
    });

    getAirQualityFromLatLon(coords.latitude, coords.longitude, (data) => {
        // OpenMeteo API를 이용하여 미세먼지(pm10, pm2.5) 정보를 가져와서 표시하는 코드
        document.querySelector('.pms').textContent = '미세먼지 : ' + data.current.pm10 + ' ' + '초미세먼지 : ' + data.current.pm2_5;
    })

    getAddressFromLatLon(coords.latitude, coords.longitude, (data) => {
        // OpenStreetMap API를 이용하여 현재 위경도를 기준으로 리버스 지오코딩 변환 후 그 주소명을 표시하는 코드
        document.querySelector('.quarterTxt').textContent = data.address.city + " " + (data.address.quarter || data.address.city_district || data.address.suburb);
    });

    let curDate = new Date();
    document.querySelector('.curDate').textContent = (curDate.getUTCMonth() + 1) + "월 " + curDate.getUTCDay() + "일 " + toStringDay(curDate.getDay()) + "요일";

    // getPeopleCount( '안양' );

    let options = {
        center: new kakao.maps.LatLng(coords.latitude, coords.longitude),
        mapTypeId: kakao.maps.MapTypeId.ROADMAP,
        level: 3
    }
    
    window.map = new kakao.maps.Map(container, options);
    window.marker = new kakao.maps.Marker({ map: window.map });

    // 지도 정보 표시 레이블 좌측에서 우측으로 이동
    let subdivs = document.querySelectorAll('.map_img > div');
    if( subdivs.length > 0 ){
        subdivs[ subdivs.length - 2 ].style.left = '';
        subdivs[ subdivs.length - 2 ].style.right = '0px';
    }

    let inputStn = document.querySelector('.search_box_wrap > input');
    inputStn.onkeypress = async(e) => {
        if( e.keyCode == 13 ){
            let place = await searchPlaces( inputStn.value );
            place     = place.find( stn => stn.category_group_name == '지하철역' );

            let lat   = place.y;
            let lon   = place.x;
            let token = place.place_name.split(' ');
            let local = place.category_name.split('>');

            // 노선 색상 정보 가져오기
            let line_clr = getLineColorFromDB( local.splice(-1)[0] );
            drawLineBox( document.querySelector('.line_box'), line_clr, token[0] );
            
            // 역 정보가 정상적인 형태(역이름 호선)로 파싱이 되었다면?
            if( token.length > 1 ){
                document.querySelector('.search_box').setAttribute('class', 'search_box search_box2');
                document.querySelector('.tit_box').style.display = 'block';
                document.querySelector('.time_box').style.display = 'block';
                document.querySelector('.timetable_box').style.display = 'block';
                document.querySelector('.tit_box > div > h2').textContent = token[0];
                document.querySelector('.tit_box > p > strong').textContent = token[1];
                document.querySelector('.weather_box').style.display = 'none';
                
                getRealtimeStation( token[0].substring(0, token[0].length - 1) ).then((obj) => {
                    let upcnt = 0;
                    let dncnt = 0;

					document.querySelector('.upline').textContent = '';
					document.querySelector('.dnline').textContent = '';
  
                    for(let line of obj){
                        let updn = document.createElement('div');

                        if( line.updnLine == '상행' ){
                            upcnt = upcnt + 1;
                            updn.textContent = line.arvlMsg2;
                            document.querySelector('.upline').appendChild(updn);
                        }else if( line.updnLine == '하행' ){
                            dncnt = dncnt + 1;
                            updn.textContent = line.arvlMsg2;
                            document.querySelector('.dnline').appendChild(updn);
                        }
                    }

                    if( upcnt > dncnt ){
                        for(let i = 0; i < upcnt - dncnt; i++){
                            let div = document.createElement('div');
                            div.textContent = 'N/A';
                            document.querySelector('.dnline').appendChild(div);
                        }
                    }else if( upcnt < dncnt ){
						for(let i = 0; i < dncnt - upcnt; i++){
                      		let div = document.createElement('div');
                      		div.textContent = 'N/A';
                     		document.querySelector('.upline').appendChild(div);
                		}
					}
                });
                // 혼잡도 그래프 그리기
                getPeopleCount( token[0].substring(0, token[0].length - 1) ).then((arr) => {
                    drawTimeBox( document.querySelector('.time_canv'), arr );
                });
            }

            // 검색한 대상 역에 해당하는 대표 이미지를 찾아와서 그림
            let stnImg = document.querySelector('.search_box2');
            if( stnImg ){
                stnImg.style.background = 'url(../resources/imges/station/' + token[0] + '.jpg)';
                stnImg.style.backgroundSize = '100% auto';
            }

            if( window.map ){
                window.map.setCenter( new kakao.maps.LatLng(lat, lon) );
                if( window.marker ){
                    window.marker.setPosition( new kakao.maps.LatLng(lat, lon) );
                }
            }
        }
    };
};
