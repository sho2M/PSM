// uploadf-fileっていうidに対応する要素を取得
const input = document.getElementById('upload-file'); 

// CSVファイルを列ごとに分割した配列に変換する関数
function divideCSV(result){
    // csvデータを行ごとに分割
    const lines = result.split('\n'); 
    
    // さらに各行を,ごとに分割しcsvデータの各セルを要素に持つ配列csvArrayを生成
    const csvArray = [];
    for (const line of lines){
        const values = line.split(',');
        csvArray.push(values);
    }
    
    // 行を格納する配列
    let columns = [[],[],[],[],[]]

    // 同じ行のセルにある数同士が同じ場所に入るように要素を格納
    for (var i=0; i<36; i++){
        columns[0].push(csvArray[i+1][0]);
        columns[1].push(csvArray[i+1][1]);
        columns[2].push(csvArray[i+1][2]);
        columns[3].push(csvArray[i+1][3]);
        columns[4].push(csvArray[i+1][4]);
    } 

    return columns;
}

// 10円単位の金額ごとに'高いと思う人'や'安いと思う人'が何％存在するかを表す配列を作成する関数
function findPercentage(csvColumns){
    // この関数が返す配列、0列目の配列は対象金額を要素に持つ、1列目の配列はその対象金額を高いと思う人の割合、同様にして2列目以降は安いと思う人の割合、高すぎて買わない、安すぎて買わないと思う人の割合
    let psmPercentage = [[],[],[],[],[]];
    
    for(var i=100; i<610; i+=10){
        // psmPercentageの0列目には金額iを格納
        psmPercentage[0].push(i);

        // i円を高いと思う人の割合, 小数第2位で四捨五入している
        const expensiveArray = csvColumns[1].filter((price) => price <= i);
        const expensiveRatio = (100*expensiveArray.length/36).toFixed(2);
        psmPercentage[1].push(expensiveRatio);

        // i円を安いと思う人の割合, 小数第2位で四捨五入している
        const cheapArray = csvColumns[2].filter((price) => price >= i);
        const cheapRatio = (100*cheapArray.length/36).toFixed(2);
        psmPercentage[2].push(cheapRatio);

        // i円を高すぎて買えないと思う人の割合, 小数第2位で四捨五入している
        const tooExpensiveArray = csvColumns[3].filter((price) => price <= i);
        const tooExpensiveRatio = (100*tooExpensiveArray.length/36).toFixed(2);
        psmPercentage[3].push(tooExpensiveRatio);

         // i円を安すぎて心配になると思う人の割合, 小数第2位で四捨五入している
         const tooCheapArray = csvColumns[4].filter((price) => price >= i);
         const tooCheapRatio = (100*tooCheapArray.length/36).toFixed(2);
         psmPercentage[4].push(tooCheapRatio);
    }

    return psmPercentage;
}

// 線分p1p2と線分p2p3が交点を持つか否かを調べる関数
function testIntersection(p1, p2, p3, p4){
    // 交点を持つときはtrue, 持たないときはfalseを格納
    let bool;

    // f12_p3はp1p2からなる線分の式にp3の座標を入れた式
    let f12_p3 = (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]);
    let f12_p4 = (p2[0] - p1[0]) * (p4[1] - p1[1]) - (p2[1] - p1[1]) * (p4[0] - p1[0]);
    let f34_p1 = (p4[0] - p3[0]) * (p1[1] - p3[1]) - (p4[1] - p3[1]) * (p1[0] - p3[0]);
    let f34_p2 = (p4[0] - p3[0]) * (p2[1] - p3[1]) - (p4[1] - p3[1]) * (p2[0] - p3[0]);

    // 以下の条件を満たすとき、線分p1p2と線分p2p3が交点を持つ
    if ((f12_p3 * f12_p4)<0 && (f34_p1 * f34_p2)<0){
        bool = true;
    } else {
        bool = false;
    }
    
    return bool;
}

// 点p[x, y]を4点引数に持ち、線分p1p2と線分p3p4の交点を返す,交点は小数第2位まで表す
function findIntersection(p1, p2, p3, p4){
    // 交点を表す配列
    let intersection = []; 

    // 線分p1p2と線分p2p3の交点を求める
    let det = (p1[0] - p2[0]) * (p4[1] - p3[1]) - (p4[0] - p3[0]) * (p1[1] - p2[1]);
    let t = ((p4[1] - p3[1]) * (p4[0] - p2[0]) + (p3[0] - p4[0]) * (p4[1] - p2[1])) / det;
    let x = t * p1[0] + (1.0 - t) * p2[0];
    let y = t * p1[1] + (1.0 - t) * p2[1];
    intersection[0] = x.toFixed(2);
    intersection[1] = y.toFixed(2);

    return intersection; 
}

// 最高価格、妥協価格などを求める関数
// 最高価格(index1=3, index2=2)、妥協価格(index1=1, index2=2)、理想価格(index1=3, index2=4)、最低品質保証価格(index1=1, index2=4)
function findPsmPrices(index1, index2, psmPercentage){
    // 折れ線グラフの交点を求める
    let intersection = [];
    for(var i=0; i<psmPercentage[0].length-1; i++){
        let p1 = [psmPercentage[0][i], psmPercentage[index1][i]];
        let p2 = [psmPercentage[0][i+1], psmPercentage[index1][i+1]];

        for(var j=0; j<psmPercentage[0].length-1; j++){
            let p3 = [psmPercentage[0][j], psmPercentage[index2][j]];
            let p4 = [psmPercentage[0][j+1], psmPercentage[index2][j+1]];

            // もし線分p1p2と線分p3p4が交点を持っていたらintersectionにその座標を代入
            if (testIntersection(p1, p2, p3, p4)){
                intersection = findIntersection(p1, p2, p3, p4);
            }
        } 
    }
    // 最高価格、妥協価格などを格納
    let psmPrice = intersection[0];
    
    return psmPrice;
}

// PSM分析のグラフ出力を行う関数
function psmChart(psmPercentage){
    var ctx = document.getElementById("myLineChart");
    var myLineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: psmPercentage[0],
        datasets: [
          {
            label: '高いと思う人の割合',
            data: psmPercentage[1],
            borderColor: "rgba(255,0,0,1)",
            backgroundColor: "rgba(0,0,0,0)"
          },
          {
            label: '安いと思う人の割合',
            data: psmPercentage[2],
            borderColor: "rgba(0,0,255,1)",
            backgroundColor: "rgba(0,0,0,0)"
          },
          {
            label: '高すぎて買えないと思う人の割合',
            data: psmPercentage[3],
            borderColor: "rgba(0,255,0,1)",
            backgroundColor: "rgba(0,0,0,0)"
          },
          {
            label: '安すぎて買わないと思う人の割合',
            data: psmPercentage[4],
            borderColor: "rgba(0,0,0,1)",
            backgroundColor: "rgba(0,0,0,0)"
          }
        ],
      },
      options: {
        title: {
          display: true,
          text: '商品の値段に対しての回答者のイメージとその割合'
        },
        scales: {
          yAxes: [{
            ticks: {
              suggestedMax: 100,
              suggestedMin: 0,
              stepSize: 10,
              callback: function(value, index, values){
                return  value +  '%'
              }
            }
          }]
        },
      }
    });

}

const reader = new FileReader();

// csvファイルを読み込ませてからの処理
input.addEventListener('change', (e) => {
    const file = e.target.files[0];

    //もし読み込んだファイルがCSVファイルだった時の処理
    if (file.type === 'text/csv') {
        reader.onload = () => {
            // 読み込んだCSVファイルを処理しPSM分析に沿ったデータに変換
            let columns = divideCSV(reader.result);
            let psmPercentage = findPercentage(columns);

            // 最高価格、妥協価格、理想価格、最低品質保証価格の算出
            const highestPrice = findPsmPrices(3, 2, psmPercentage);
            const compromisePrice = findPsmPrices(1, 2, psmPercentage);
            const idealPrice = findPsmPrices(3, 4, psmPercentage);
            const guaranteedMinimumQualityPrice = findPsmPrices(1, 4, psmPercentage);
            
            // HTMLへの結果の表示内容
            const psmResult = `
            最高価格: ${highestPrice}円<br>
            妥協価格: ${compromisePrice}円<br>
            理想価格: ${idealPrice}円<br>
            最低品質保証価格: ${guaranteedMinimumQualityPrice}円
            `;
            
            // HTMLへの出力の埋め込み
            var results = document.getElementById("results");
            results.innerHTML = psmResult;

            // グラフを作成
            psmChart(psmPercentage);

            // デバッグ用のコンソール出力
            console.log(psmResult);
        }
        reader.readAsText(file);
    }

});

