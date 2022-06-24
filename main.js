window.onload = () => {
    let container = document.querySelector('.mapview');
    let options = {
        center: new kakao.maps.LatLng(33.450701,126.570667),
        level: 3
    }
    
    window.map = new kakao.maps.Map(container, options);
    // 초기 상태에서 그래프 숨기기
    hideGraph();
};
function deflateSide(){
    document.querySelector('.expendbtn_icon_wrapper').style.backgroundImage = 'url(./icons/arrow.svg)';
    document.querySelector('.expendarea').style.transform = 'translateX(-480px)';
    document.querySelector('header').style.left = '20px';
}
function inflateSide(){
    document.querySelector('.expendbtn_icon_wrapper').style.backgroundImage = 'url(./icons/arrow_reverse.svg)';
    document.querySelector('.expendarea').style.transform = 'translateX(0px)';
    document.querySelector('header').style.left = '500px';
}
function toggleSide(){
    this.isInflateSide = !this.isInflateSide;
    if( this.isInflateSide ){
        deflateSide();
    }else{
        inflateSide();
    }
}
function setMarkerVisible( visible ){
    if( !window.marker ){
        return;
    }

    window.marker.setVisible( visible );
}

function searchStationColorInfo( line ){
    let xhr = new XMLHttpRequest;
    xhr.open('GET','./db/metro_colors.json',false);
    xhr.send();

    let metroClrs = JSON.parse( xhr.responseText );

    if( !line ){
        return '';
    }
    
    if( line.indexOf("수도권") > -1 && line.indexOf("호선") > -1 ){
        let lineNum = line.match(/\d/g);
        if( lineNum.length > 0 ){
            let ret = lineNum[0] === '9' ? metroClrs['S9'][0][lineNum[0]] : metroClrs['SM'][0][lineNum[0]];
            return ret;
        }
    }

    if( line.indexOf("인천") > -1 && line.indexOf("호선") > -1 ){
        let lineNum = line.match(/\d/g);
        if( lineNum.length > 0 ){
            return metroClrs['IM'][0][lineNum[0]];
        }
    }

    if( line === '경의중앙선' ){
        return metroClrs['KR'][0]['1'];
    }

    if( line === '수인분당선' ){
        return metroClrs['KR'][0]['2'];
    }

    if( line === '경강선' ){
        return metroClrs['KR'][0]['3'];
    }

    if( line === '공항철도' ){
        return metroClrs['KA'][0]['A'];
    }

    if( line === '김포골드라인' ){
        return metroClrs['GG'][0]['G'];
    }
    
    return '';
}

function clearTimeTableBox(){
    let boxs = document.getElementsByClassName('timetablebox');
    for(let i = boxs.length - 1; i > -1 ; i--){
        boxs[i].remove();
    }
}

function appendTimeTableBox( name,color,tostn,dnstn ){
    let tostn_text = tostn ? tostn : '상행 종착역';
    let dnstn_text = dnstn ? dnstn : '하행 종착역';

    let box = document.createElement('div');
    box.setAttribute('class','timetablebox');
    box.className = 'timetablebox';

    let header = document.createElement('div');
    header.setAttribute('class','timetablebox_header');
    header.className = 'timetablebox_header';

    let title = document.createElement('div');
    title.setAttribute('class','timetablebox_title');
    title.className = 'timetablebox_title unselectable';
    title.style.borderColor = color;
    title.textContent = name;

    let content = document.createElement('div');
    content.setAttribute('class','timetablebox_content');
    content.className = 'timetablebox_content';

    let left = document.createElement('div');
    let right = document.createElement('div');

    let left_header = document.createElement('div');
    let right_header = document.createElement('div');

    let left_timer = document.createElement('div');
    let right_timer = document.createElement('div');

    left_timer.textContent = '잠시 후 도착';
    right_timer.textContent = '잠시 후 도착';
    left_timer.setAttribute('class','timetablebox_towardtimer');
    left_timer.className = 'timetablebox_towardtimer';
    right_timer.setAttribute('class','timetablebox_towardtimer');
    right_timer.className = 'timetablebox_towardtimer';

    left_header.textContent = tostn_text;
    right_header.textContent = dnstn_text;
    left_header.setAttribute('class','timetablebox_subheader');
    left_header.className = 'timetablebox_subheader';
    right_header.setAttribute('class','timetablebox_subheader'); 
    right_header.className = 'timetablebox_subheader';

    left.appendChild( left_header );
    right.appendChild( right_header );
    left.appendChild( left_timer );
    right.appendChild( right_timer );

    content.appendChild( left ); 
    content.appendChild( right );

    let side = document.querySelector('.expendarea');

    header.appendChild( title );
    box.appendChild( header );
    box.appendChild( content );

    side.appendChild( box );
}

function parseStationName( name ){
    let idx = name.indexOf('역');
    let ret = idx < 0 ? name : name.substring(0,idx);
    return ret;
}

function resetGraphBar(){
    let data = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    addGraphBar( data );
}

function showGraph(){
    document.querySelector('.info_graph').style.display = 'block';
}

function hideGraph(){
    document.querySelector('.info_graph').style.display = 'none';
}

function addGraphBar( list ){
    let canv = document.querySelector(".info_graph");
    let ctx = canv.getContext('2d');

    ctx.font = '12px Arial';

    for(let i = 0; i < list.length; i++){
        ctx.fillStyle = '#70b0ff';
        ctx.fillRect((i * 24) + 5,210 - list[i],12,5 + list[i]);
        ctx.fillStyle = '#999999';
        ctx.fillText( i + 5 > 9 ? (i + 5) + '' : '0' + (i + 5) + '',(i * 24) + 4, 228);
    }
}

function searchPlaces( val ){
    let ps = new kakao.maps.services.Places();

    ps.keywordSearch( val, (data, status, pagination) => {
        let bounds = new kakao.maps.LatLngBounds();
        bounds.extend(new kakao.maps.LatLng(data[0].y,data[0].x));

        // 역이 아닌 장소를 검색했을 때, 예외처리
        if( data[0].category_name.indexOf('지하철,전철') < 0 && data[0].category_name.indexOf('기차,철도') < 0 ){
            alert('역명만 검색해주세요!');
            return;
        }

        // 장소 정보에서 역 지하철 노선 정보를 추출
        let lines = data.map( item => item.category_name.split('>').map( subitem => subitem.trim() ) );
        window.stationLines = [];

        for(let i = 0; i < lines.length; i++){
            if( lines[i].length > 1 ){
                if( lines[i][1] === '지하철,전철' ){
                    // 중복 역 노선 입력 방지
                    if( window.stationLines.indexOf( lines[i][2] ) < 0 ){
                        window.stationLines.push( lines[i][2] );
                    }
                }
            }
        }

        // 추출된 노선 정보를 기반으로 역 시간표 레이아웃을 생성
        if( window.stationLines ){
            clearTimeTableBox();
            for(let i = 0; i < window.stationLines.length ; i++){
                let color = searchStationColorInfo(  window.stationLines[i] );
                if( color != '' ){
                    // 도착시간 가져오기
                    sendAJAX_GET('/getRealtimeStation?stationName=' + parseStationName( data[0].place_name ),( recvdata,status ) => {
                        // JSON 문자열을 JSON 객체로 파싱
                        if( !recvdata ){
                            return;
                        }
                        let parsedData = JSON.parse( recvdata );

                        if( parsedData.realtimeArrivalList.updnLine === '상행' ){
                            // 상행 처리
                            appendTimeTableBox( parseStationName( data[0].place_name ), color, parsedData.realtimeArrivalList.bstatnNm );
                        }else{
                            // 하행 처리
                            appendTimeTableBox( parseStationName( data[0].place_name ), color, null, parsedData.realtimeArrivalList.bstatnNm );
                        }

                        document.querySelector('.timetablebox_towardtimer').textContent = parsedData.realtimeArrivalList.barvlDt + "초 후 도착";
                    });
                }
            }
        }

        if( window.map ){
            window.map.setBounds( bounds );
            if( !window.marker ){
                window.marker = new kakao.maps.Marker({
                    map: window.map,
                    position: new kakao.maps.LatLng(data[0].y,data[0].x)
                })
            }else{
                window.marker.setPosition(new kakao.maps.LatLng(data[0].y,data[0].x));
            }
        }

        // 검색을 통하여 노선 검색결과가 나오면, 혼잡도 그래프도 다시 띄우기
        showGraph();
        // 혼잡도 그래프 초기화
        resetGraphBar();

        let stationName = parseStationName( data[0].place_name );
        // 서버에서 혼잡도 정보 받아오기
        sendAJAX_GET('/returnPeopleCount?stationName=' + stationName,( recvdata,status ) => {
            // JSON 문자열을 JSON 객체로 파싱
            if( !recvdata ){
                return;
            }
            let parsedData = JSON.parse( recvdata );

            // 값 정규화 ( 그래프 규모 기반 )
            const CONST_NORM     = 0.000005;
            const CONST_MAXRANGE = 100.0;
            parsedData.fiveRide        = (parsedData.fiveRide        * CONST_NORM) * CONST_MAXRANGE;
            parsedData.sixRide         = (parsedData.sixRide         * CONST_NORM) * CONST_MAXRANGE;
            parsedData.sevenRide       = (parsedData.sevenRide       * CONST_NORM) * CONST_MAXRANGE;
            parsedData.eightRide       = (parsedData.eightRide       * CONST_NORM) * CONST_MAXRANGE;
            parsedData.nineRide        = (parsedData.nineRide        * CONST_NORM) * CONST_MAXRANGE;
            parsedData.tenRide         = (parsedData.tenRide         * CONST_NORM) * CONST_MAXRANGE;
            parsedData.elevenRide      = (parsedData.elevenRide      * CONST_NORM) * CONST_MAXRANGE;
            parsedData.twelveRide      = (parsedData.twelveRide      * CONST_NORM) * CONST_MAXRANGE;
            parsedData.thirteenRide    = (parsedData.thirteenRide    * CONST_NORM) * CONST_MAXRANGE;
            parsedData.fourteenRide    = (parsedData.fourteenRide    * CONST_NORM) * CONST_MAXRANGE;
            parsedData.fifteenRide     = (parsedData.fifteenRide     * CONST_NORM) * CONST_MAXRANGE;
            parsedData.sixteenRide     = (parsedData.sixteenRide     * CONST_NORM) * CONST_MAXRANGE;
            parsedData.seventeenRide   = (parsedData.seventeenRide   * CONST_NORM) * CONST_MAXRANGE;
            parsedData.eighteenRide    = (parsedData.eighteenRide    * CONST_NORM) * CONST_MAXRANGE;
            parsedData.nineteenRide    = (parsedData.nineteenRide    * CONST_NORM) * CONST_MAXRANGE;
            parsedData.twentyRide      = (parsedData.twentyRide      * CONST_NORM) * CONST_MAXRANGE;
            parsedData.twentyoneRide   = (parsedData.twentyoneRide   * CONST_NORM) * CONST_MAXRANGE;
            parsedData.twentytwoRide   = (parsedData.twentytwoRide   * CONST_NORM) * CONST_MAXRANGE;
            parsedData.twentythreeRide = (parsedData.twentythreeRide * CONST_NORM) * CONST_MAXRANGE;
            parsedData.midnightRide    = (parsedData.midnightRide    * CONST_NORM) * CONST_MAXRANGE;

            // 정규화된 데이터 셋으로 그래프 배열 생성
            let dataArr = [
                parsedData.fiveRide,
                parsedData.sixRide,
                parsedData.sevenRide,
                parsedData.eightRide,
                parsedData.nineRide,
                parsedData.tenRide,
                parsedData.elevenRide,
                parsedData.twelveRide,
                parsedData.thirteenRide,
                parsedData.fourteenRide,
                parsedData.fifteenRide,
                parsedData.sixteenRide,
                parsedData.seventeenRide,
                parsedData.eighteenRide,
                parsedData.nineteenRide,
                parsedData.twentyRide,
                parsedData.twentyoneRide,
                parsedData.twentytwoRide,
                parsedData.twentythreeRide,
                parsedData.midnightRide
            ];

            // 기존의 그래프는 초기화
            resetGraphBar();

            // 정규화된 데이터 셋을 사용하여 새로운 그래프를 그리기
            addGraphBar( dataArr );
        });
    }); 
}

function sendAJAX_GET( url,callback ){
    let xhr = new XMLHttpRequest;
    xhr.open('GET',url);
    xhr.onreadystatechange = (event) => {
        let { target } = event;

        if( target.readyState === XMLHttpRequest.DONE ){
            let { status } = target;
            callback( xhr.responseText, status );
        }
    }
    xhr.send();
}