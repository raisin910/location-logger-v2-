// メインアプリケーションのコード
document.addEventListener('DOMContentLoaded', initApp);

// グローバル変数
let isLogging = false;
let loggingInterval = null;
let locationData = [];
let deviceId = '';
let map = null;
let markers = [];

// DOM要素
const elements = {
    statusEl: null,
    startBtn: null,
    stopBtn: null,
    sendDataBtn: null,
    downloadBtn: null,
    showMapBtn: null,
    mapContainer: null,
    closeMapBtn: null,
    deviceIdInput: null,
    intervalInput: null,
    sheetUrlInput: null,
    logContainer: null,
    mapDiv: null
};

// アプリケーションの初期化
function initApp() {
    initElements();
    loadSettings();
    loadStoredData();
    
    // イベントリスナーの登録
    elements.startBtn.addEventListener('click', startLogging);
    elements.stopBtn.addEventListener('click', stopLogging);
    elements.sendDataBtn.addEventListener('click', sendData);
    elements.downloadBtn.addEventListener('click', downloadData);
    elements.showMapBtn.addEventListener('click', showOnMap);
    elements.closeMapBtn.addEventListener('click', closeMap);
    
    elements.deviceIdInput.addEventListener('change', saveSettings);
    elements.intervalInput.addEventListener('change', saveSettings);
    elements.sheetUrlInput.addEventListener('change', saveSettings);
    
    log('アプリが初期化されました');
}

// DOM要素の初期化
function initElements() {
    elements.statusEl = document.getElementById('status');
    elements.startBtn = document.getElementById('startBtn');
    elements.stopBtn = document.getElementById('stopBtn');
    elements.sendDataBtn = document.getElementById('sendDataBtn');
    elements.downloadBtn = document.getElementById('downloadBtn');
    elements.showMapBtn = document.getElementById('showMapBtn');
    elements.mapContainer = document.getElementById('mapContainer');
    elements.closeMapBtn = document.getElementById('closeMapBtn');
    elements.deviceIdInput = document.getElementById('deviceId');
    elements.intervalInput = document.getElementById('interval');
    elements.sheetUrlInput = document.getElementById('sheetUrl');
    elements.logContainer = document.getElementById('logContainer');
    elements.mapDiv = document.getElementById('map');
}

// ステータスの更新
function updateStatus(message, isError = false) {
    elements.statusEl.textContent = message;
    elements.statusEl.style.backgroundColor = isError ? '#ffebee' : '#eee';
    elements.statusEl.style.color = isError ? '#d32f2f' : '#333';
}

// ログの追加
function log(message) {
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    elements.logContainer.appendChild(logEntry);
    elements.logContainer.scrollTop = elements.logContainer.scrollHeight;
}

// 設定の保存
function saveSettings() {
    localStorage.setItem('deviceId', elements.deviceIdInput.value);
    localStorage.setItem('interval', elements.intervalInput.value);
    localStorage.setItem('sheetUrl', elements.sheetUrlInput.value);
    deviceId = elements.deviceIdInput.value;
    log('設定が保存されました');
}

// ローカルストレージにデータを保存
function saveDataToStorage() {
    try {
        localStorage.setItem('locationData', JSON.stringify(locationData));
        elements.sendDataBtn.disabled = false;
        elements.downloadBtn.disabled = false;
        elements.showMapBtn.disabled = false;
    } catch (e) {
        log('警告: ローカルストレージへの保存に失敗しました');
        console.error('Storage error:', e);
    }
}

// 設定の読み込み
function loadSettings() {
    elements.deviceIdInput.value = localStorage.getItem('deviceId') || '';
    elements.intervalInput.value = localStorage.getItem('interval') || '60';
    elements.sheetUrlInput.value = localStorage.getItem('sheetUrl') || '';
    
    // ランダムなデバイスIDを生成（未設定の場合）
    if (!elements.deviceIdInput.value) {
        elements.deviceIdInput.value = 'device_' + Math.random().toString(36).substring(2, 10);
    }
    
    deviceId = elements.deviceIdInput.value;
}

// ローカルストレージからデータを読み込む
function loadStoredData() {
    try {
        const storedData = localStorage.getItem('locationData');
        if (storedData) {
            locationData = JSON.parse(storedData);
            
            if (locationData.length > 0) {
                elements.sendDataBtn.disabled = false;
                elements.downloadBtn.disabled = false;
                elements.showMapBtn.disabled = false;
                log(`${locationData.length}件の保存データを読み込みました`);
            }
        }
    } catch (e) {
        console.error('Data loading error:', e);
    }
}

// ロギング状態に応じてUIを更新
function updateLoggingState(isLogging) {
    elements.startBtn.disabled = isLogging;
    elements.stopBtn.disabled = !isLogging;
    elements.deviceIdInput.disabled = isLogging;
    elements.intervalInput.disabled = isLogging;
}

// ロギングの開始
function startLogging() {
    if (isLogging) return;
    
    if (!elements.deviceIdInput.value) {
        updateStatus('エラー: デバイスIDを入力してください。', true);
        return;
    }
    
    // 入力値の検証
    const interval = parseInt(elements.intervalInput.value);
    if (isNaN(interval) || interval < 10) {
        updateStatus('エラー: 間隔は10秒以上を指定してください。', true);
        return;
    }
    
    // 設定を保存
    saveSettings();
    
    // 状態の更新
    isLogging = true;
    updateLoggingState(true);
    
    // 最初の位置情報取得
    getLocation();
    
    // 定期的な位置情報取得を設定
    loggingInterval = setInterval(getLocation, interval * 1000);
    
    updateStatus(`ロギング中: ${interval}秒間隔`);
    log(`ロギングを開始しました（間隔: ${interval}秒）`);
}

// ロギングの停止
function stopLogging() {
    if (!isLogging) return;
    
    // インターバルをクリア
    clearInterval(loggingInterval);
    
    // 状態の更新
    isLogging = false;
    updateLoggingState(false);
    
    updateStatus('ロギング停止済み');
    log('ロギングを停止しました');
}

// 位置情報の取得
function getLocation() {
    updateStatus('位置情報を取得中...');
    
    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            positionSuccess,
            positionError,
            options
        );
    } else {
        updateStatus('エラー: Geolocation APIをサポートしていません。', true);
    }
}

// 位置情報取得成功時の処理
function positionSuccess(position) {
    const timestamp = new Date().toISOString();
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const accuracy = position.coords.accuracy;
    
    const locationEntry = {
        deviceId: deviceId,
        timestamp: timestamp,
        latitude: latitude,
        longitude: longitude,
        accuracy: accuracy
    };
    
    // データの追加
    locationData.push(locationEntry);
    
    // ローカルストレージにデータを保存
    saveDataToStorage();
    
    updateStatus(`ロギング中: 最終取得 ${new Date().toLocaleTimeString()}`);
    log(`位置: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (精度: ${accuracy.toFixed(1)}m)`);
}

// 位置情報取得エラー時の処理
function positionError(error) {
    let errorMsg = '';
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            errorMsg = '位置情報の利用が許可されていません。';
            break;
        case error.POSITION_UNAVAILABLE:
            errorMsg = '位置情報を取得できませんでした。';
            break;
        case error.TIMEOUT:
            errorMsg = '位置情報の取得がタイムアウトしました。';
            break;
        default:
            errorMsg = '不明なエラーが発生しました。';
            break;
    }
    
    updateStatus(`エラー: ${errorMsg}`, true);
    log(`エラー: ${errorMsg}`);
}

// データの送信（日付フォーマット改善版）
function sendData() {
    if (locationData.length === 0) {
        updateStatus('送信するデータがありません。', true);
        return;
    }
    
    const sheetUrl = elements.sheetUrlInput.value.trim();
    if (!sheetUrl) {
        updateStatus('エラー: スプレッドシートURLを入力してください。', true);
        return;
    }
    
    updateStatus('データ送信中...');
    log(`${locationData.length}件のデータを送信中...`);
    
    // データ送信用のオブジェクト - 日付を書式化
    const formattedLocations = locationData.map(loc => {
        // ISO形式の日時文字列をDateオブジェクトに変換
        const date = new Date(loc.timestamp);
        
        // YYYY.MM.DD.HH.MM 形式に変換
        const formattedDate = 
            date.getFullYear() + '.' + 
            padZero(date.getMonth() + 1) + '.' + 
            padZero(date.getDate()) + '.' + 
            padZero(date.getHours()) + '.' + 
            padZero(date.getMinutes());
        
        return {
            ...loc,
            formattedDate: formattedDate // 書式化された日付を追加
        };
    });
    
    const dataToSend = {
        deviceId: deviceId,
        locations: formattedLocations
    };
    
    console.log('送信URL:', sheetUrl);
    console.log('送信データ:', dataToSend);
    
    // no-corsモードでテスト
    fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors', // CORSエラーを回避するためのテスト
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
    })
    .then(response => {
        // no-corsモードではレスポンスの中身にアクセスできないので、成功と仮定
        console.log('レスポンス受信(詳細不明):', response);
        log(`データを送信しました (${locationData.length}件) - 応答の詳細は不明`);
        updateStatus(`${locationData.length}件のデータを送信しました`);
        
        // 送信が完了したらデータをクリア
        locationData = [];
        saveDataToStorage();
        
        elements.sendDataBtn.disabled = true;
        elements.downloadBtn.disabled = true;
        elements.showMapBtn.disabled = true;
    })
    .catch(error => {
        console.error('送信エラー詳細:', error);
        updateStatus(`送信エラー: ${error.message}`, true);
        log(`送信エラー: ${error.message} - データはローカルに保存されています`);
        
        // エラー時にはデータダウンロードを推奨
        log('「データをダウンロード」ボタンを使用してデータを保存できます');
    });
}

// ゼロパディング関数
function padZero(num) {
    return num.toString().padStart(2, '0');
}

// データをJSONファイルとしてダウンロード
function downloadData() {
    if (locationData.length === 0) {
        updateStatus('ダウンロードするデータがありません。', true);
        return;
    }
    
    const dataStr = JSON.stringify({
        deviceId: deviceId,
        exportTime: new Date().toISOString(),
        locations: locationData
    }, null, 2);
    
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `location_data_${deviceId}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    updateStatus(`${locationData.length}件のデータをダウンロードしました`);
    log(`データをJSONファイルとしてダウンロードしました (${locationData.length}件)`);
}

// 地図表示関数
function showOnMap() {
    if (locationData.length === 0) {
        updateStatus('表示するデータがありません。', true);
        return;
    }
    
    showLocations(locationData);
    updateStatus('地図にデータを表示しました');
}

// 地図を閉じる
function closeMap() {
    elements.mapContainer.style.display = 'none';
}

// 位置情報データを地図上に表示
function showLocations(locations) {
    if (!map) {
        // 地図の初期化
        map = new google.maps.Map(elements.mapDiv, {
            zoom: 15,
            center: { lat: 35.6812, lng: 139.7671 }, // 東京駅をデフォルト表示
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
    }
    
    // 既存のマーカーをクリア
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    
    if (locations.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    
    // 各位置情報にマーカーを配置
    locations.forEach((loc, index) => {
        const position = {
            lat: loc.latitude,
            lng: loc.longitude
        };
        
        // マーカーを作成
        const marker = new google.maps.Marker({
            position: position,
            map: map,
            title: `位置 ${index + 1} (${new Date(loc.timestamp).toLocaleString()})`,
            label: `${index + 1}`
        });
        
        // 情報ウィンドウを作成
        const infoContent = `
            <div style="padding: 10px;">
                <h3 style="margin-top: 0;">位置 ${index + 1}</h3>
                <p>日時: ${new Date(loc.timestamp).toLocaleString()}</p>
                <p>緯度: ${loc.latitude.toFixed(6)}</p>
                <p>経度: ${loc.longitude.toFixed(6)}</p>
                <p>精度: ${loc.accuracy.toFixed(1)}m</p>
            </div>
        `;
        
        const infoWindow = new google.maps.InfoWindow({
            content: infoContent
        });
        
        // マーカークリックでinfoWindowを表示
        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });
        
        markers.push(marker);
        bounds.extend(position);
    });
    
    // すべてのマーカーが表示されるようにマップを調整
    map.fitBounds(bounds);
    
    // 単一のマーカーの場合はズームを調整
    if (locations.length === 1) {
        map.setZoom(16);
    }
    
    // マップコンテナを表示
    elements.mapContainer.style.display = 'block';
}
