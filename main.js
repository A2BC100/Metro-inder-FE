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

    if( val.indexOf('역') < 0 ){
        alert('역 이름을 검색해주세요');
        return;
    }
    
    ps.keywordSearch( val, (data, status, pagination) => {
        let bounds = new kakao.maps.LatLngBounds();
        bounds.extend(new kakao.maps.LatLng(data[0].y,data[0].x));

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