window.onload = () => {
    let container = document.querySelector('.mapview');
    let options = {
        center: new kakao.maps.LatLng(33.450701,126.570667),
        level: 3
    }
    
    window.map = new kakao.maps.Map(container, options);
};
function deflateSide(){
    let side = document.querySelector('.expendarea');
    let header = document.getElementsByTagName('header')[0];
    side.style.width = '0px';
    header.style.left = '20px';
}
function inflateSide(){
    let side = document.querySelector('.expendarea');
    let header = document.getElementsByTagName('header')[0];
    side.style.width = '480px';
    header.style.left = '500px';
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
    
    if( line.indexOf("수도권") > -1 && line.indexOf("호선") > -1 ){
        let lineNum = line.match(/\d/g);
        if( lineNum.length > 0 ){
            return metroClrs['SM'][0][lineNum[0]];
        }
    }

    if( line.indexOf("인천") > -1 && line.indexOf("호선") > -1 ){
        let lineNum = line.match(/\d/g);
        if( lineNum.length > 0 ){
            return metroClrs['IM'][0][lineNum[0]];
        }
    }

    if( line === '경의중앙성' ){
        return metroClrs['KR'][0]['1'];
    }

    if( line === '수인분당선' ){
        return metroClrs['KR'][0]['2'];
    }

    if( line === '경강선' ){
        return metroClrs['KR'][0]['3'];
    }
    
    return '';
}

function clearTimeTableBox(){
    let boxs = document.getElementsByClassName('timetablebox');
    for(let i = boxs.length - 1; i > -1 ; i--){
        boxs[i].remove();
    }
}

function appendTimeTableBox( name,color ){
    let box = document.createElement('div');
    box.setAttribute('class','timetablebox');
    box.className = 'timetablebox';

    let header = document.createElement('div');
    header.setAttribute('class','timetablebox_header');
    header.className = 'timetablebox_header';

    let title = document.createElement('div');
    title.setAttribute('class','timetablebox_title');
    title.className = 'timetablebox_title';
    title.style.borderColor = color;
    title.textContent = name;

    let side = document.querySelector('.expendarea');

    header.appendChild( title );
    box.appendChild( header );

    side.appendChild( box );
}

function parseStationName( name ){
    let idx = name.indexOf('역');
    let ret = idx < 0 ? name : name.substring(0,idx);
    return ret;
}

function searchPlaces( val ){
    let ps = new kakao.maps.services.Places();

    ps.keywordSearch( val, (data, status, pagination) => {
        console.log(data);
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
                    appendTimeTableBox( parseStationName( data[0].place_name ), color );
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
    });
}