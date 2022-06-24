window.onload = () => {
    let container = document.querySelector('.mapview');
    let options = {
        center: new kakao.maps.LatLng(33.450701,126.570667),
        level: 3
    }

    window.filterCategories = [
        '지하철',
        '전철',
        '기차',
        '철도'
    ];
    
    window.map = new kakao.maps.Map(container, options);
};
function deflateSide(){
    let side = document.querySelector('.expendarea');
    let ubox = document.querySelector('.userbox');
    let header = document.getElementsByTagName('header')[0];
    side.style.width = '0px';
    ubox.style.display = 'none';
    header.style.left = '20px';
}
function inflateSide(){
    let side = document.querySelector('.expendarea');
    let ubox = document.querySelector('.userbox');
    let header = document.getElementsByTagName('header')[0];
    side.style.width = '480px';
    header.style.left = '500px';

    setTimeout(() => {
        ubox.style.display = 'block';
    })
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

function searchPlaces( val ){
    let ps = new kakao.maps.services.Places();
    
    ps.keywordSearch( val, (data, status, pagination) => {
        let bounds = new kakao.maps.LatLngBounds();
        bounds.extend(new kakao.maps.LatLng(data[0].y,data[0].x));

        if( window.filterCategories ){
            // 필터를 이용하여 사용자가 검색한 장소가 역(Station)인지? 확인
            let matchArr = window.filterCategories.filter( item => data[0].category_name.indexOf(item) > -1 );
            if( matchArr.length == 0 ){
                // 사용자가 입력한 장소 카테고리가 역(Station)이 아니라면 예외처리
                alert('역명을 입력해주세요');
                return;
            }
        }else{
            return;
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