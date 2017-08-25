const express = require('express');
const app = express();
const portNumber = 4000;
const cheerio = require('cheerio-httpcli');

//MySQL
const mysqlConfig = require("../config/db/mysql.json");
const mysql = require('mysql');
const connection = mysql.createConnection({
    host : mysqlConfig.host,
    user : mysqlConfig.user,
    password : mysqlConfig.password,
    database : mysqlConfig.database
});
connection.connect(function (err) {
    if (err) {
        console.log("! mysql connection error");
        console.log(err);
        throw err;
    } else {
        console.log("* mysql connection success");
    }
});

/****************************************************************************************/

const googleSearch = (searchWord) => {

    const word = searchWord + " 쿠키영상";

    const basicUrl = 'https://www.google.com/search';
    const numSearchDataNum = 100; //max:100
    const startPostNum = 100;

    const setUrl = (numSearchData, startPost) => {
        return basicUrl + "?num=" + numSearchData + "&start=" + startPost;
    };

    const url = setUrl(numSearchDataNum, startPostNum);

    const p = cheerio.fetch(url, { q: word });

    const pp = p.then(function (result) {
        const header = result.response.headers;
        /*
        { 'content-type': 'text/html; charset=UTF-8',
          date: 'Wed, 23 Aug 2017 13:35:18 GMT',
          expires: '-1',
          'cache-control': 'private, max-age=0',
          p3p: 'CP="This is not a P3P policy! See https://www.google.com/support/accounts/answer/151657?hl=en for more info."',
          'content-encoding': 'gzip',
          server: 'gws',
          'x-xss-protection': '1; mode=block',
          'x-frame-options': 'SAMEORIGIN',
          'set-cookie': [ 'NID=110=g_wTyMWGNjNsYd09yV9tWRmeeutR7FhtP57HRZsx1x8OsiE8NRmY5ihegJiwLaNrajJhwSWcxpd4aYRPbR1fuRKeOgsagie_O369fbzWhugz8Eq9yKv-YNbxjh6eFfob; expires=Thu, 22-Feb-2018 13:35:18 GMT; path=/; domain=.google.co.kr; HttpOnly' ],
          'alt-svc': 'quic=":443"; ma=2592000; v="39,38,37,35"',
          connection: 'close',
          'transfer-encoding': 'chunked' }
         */

        const pagetitle = result.$('title').text();
        console.log("\n> " + pagetitle);

        const resultStatsTextSplit = result.$('#resultStats').text().split(" ");

        let resultStats = {
            title : pagetitle,
            post : 0,
            page : 0,
            state : "wait"
            /*
            state : {
              wait : 처리 대기

              shortData : 데이터 부족하여 처리 불가
              enoughData : 데이터 충분하여 처리 가능
              crawlingBlock : 크롤링 블록 당함
            }
             */
        };

        if(pagetitle.indexOf("검색") === -1){
            resultStats = {
                state : "crawlingBlock"
            }
        } else if(resultStatsTextSplit.length <= 5){
            resultStats = {
                title : pagetitle,
                post : parseInt(resultStatsTextSplit[1].replace(/[^0-9]/g,"")),
                page : parseInt(resultStatsTextSplit[3].replace(/[^0-9]/g,"")),
                state : "enoughData"
            };

        }else{
            resultStats = {
                title : pagetitle,
                state : "shortData"
            }
        }

        return resultStats;
    });

    p.catch(function (err) {
        console.log(err);
    });

    p.finally(function () {
        console.log('\n> p / done');
    });


    pp.then((result)=>{
        console.log("\n> pp / response : \n", result);

        const urls = ["https://www.google.com/search?num=100"];
        const maxPage = result.page;
        for(let i = 1; i < maxPage; i++){
            urls.push(setUrl(numSearchDataNum, numSearchDataNum*(i)));
        }

        console.log("\n> urls : ", urls);

        const passQuery = {
            p : [
                searchWord, "쿠키"
            ],
            np : [
                "스포",
                "유무",
                "?"
            ]
        };
        const passQueryLength = {
            p : passQuery.p.length,
            np : passQuery.np.length
        };

        const checkQuery = {
            p : [
                {
                    str : "있",
                    score : 1
                },
                {
                    str : "있다",
                    score : 1
                },
                {
                    str : "있음",
                    score : 1
                },
                {
                    str : "있어요",
                    score : 1
                },
                {
                    str : "있습니다",
                    score : 1
                }
            ],
            np : [
                {
                    str : "없",
                    score : 1
                },
                {
                    str : "없다",
                    score : 1
                },
                {
                    str : "없음",
                    score : 1
                },
                {
                    str : "없어요",
                    score : 1
                },
                {
                    str : "없습니다",
                    score : 1
                }
            ]
        };

        let pNum = 0;
        let npNum = 0;
        let pageCnt = 0;
        let postCnt = 0;

        let cnt = 1;

        Promise.all(urls.map((url) => {
            const p = cheerio.fetch(url, { q: word });
            const pp = p.then((result)=>{
                console.log("\n> p.then");

                result.$('#search .rc').each(function (idx) {

                    console.log("> title info : cnt=" + cnt++ + " / idx=" + idx);
                    const title = result.$(this).find('.r>a').text();


                    let passCheckNum = 0;
                    let passCheckResult = false; // 패스 조건 모두 통과
                    let passCheckCookie = false; // 패스 조건 첫번째 조건만을 통과, "영화 이름"

                    passQuery.p.map(function(v){ // 함수화 필요
                        if(title.indexOf(v) !== -1) {
                            passCheckNum += 1;
                        }
                    });

                    if(title.indexOf(passQuery.p[0]) !== -1) passCheckCookie = true;

                    if(passCheckNum === passQueryLength.p) {
                        passCheckResult = true;
                    }

                    passQuery.np.map(function(v){
                        if(title.indexOf(v) !== -1) passCheckResult = false;
                    });

                    if(passCheckResult){ // 제목 조건 통과
                        console.log("> 제목 검사");
                        const filterStr = "쿠키" + title.split("쿠키")[1];

                        if(filterStr.indexOf("있") !== -1){
                            console.log("> T-O : ", filterStr);
                        }
                        if(filterStr.indexOf("없") !== -1){
                            console.log("> T-X : ", filterStr);
                        }


                        checkQuery.p.map(function(v){
                            if(filterStr.indexOf(v.str) !== -1){
                                pNum += v.score;
                            }
                        });
                        checkQuery.np.map(function(v){
                            if(filterStr.indexOf(v.str) !== -1){
                                npNum += v.score;
                            }
                        });
                    } else if(passCheckCookie){ // 제목 패스 첫번째 조건만 통과, 내용 검사 시작
                        console.log("> 내용 검사");
                        const sub = result.$(this).find('.s span').text();

                        let passCheckNum = 0;
                        let passCheckResult = false; // 패스 조건 모두 통과

                        passQuery.p.map(function(v){ // 함수화 필요
                            if(sub.indexOf(v) !== -1) {
                                passCheckNum += 1;
                            }
                        });

                        if(passCheckNum === passQueryLength.p) {
                            passCheckResult = true;
                        }

                        passQuery.np.map(function(v){
                            if(sub.indexOf(v) !== -1) passCheckResult = false;
                        });

                        if(passCheckResult){ // 내용 조건 통과
                            //console.log("> sub 조건 모두 통과");
                            const filterStr = sub.substr(sub.indexOf(searchWord), 32 + searchWord.length);

                            if(filterStr.indexOf(passQuery.p[1]) !== -1){
                                if(filterStr.indexOf("있") !== -1){
                                    console.log("> S-O : ", filterStr);
                                }
                                if(filterStr.indexOf("없") !== -1){
                                    console.log("> S-X : ", filterStr);
                                }


                                checkQuery.p.map(function(v){
                                    if(filterStr.indexOf(v.str) !== -1){
                                        pNum += v.score;
                                    }
                                });
                                checkQuery.np.map(function(v){
                                    if(filterStr.indexOf(v.str) !== -1){
                                        npNum += v.score;
                                    }
                                });
                            }
                        }

                    }
                });
                console.log("\n*********> PASS : "+pNum+" / NO-PASS : "+npNum+"\n");
            });
        }));
    });


};
//googleSearch("옥자");

/****************************************************************************************/

const naverSearch = (where, searchWord) => {

    // Set URL
    const cookieWord = encodeURIComponent(" 쿠키영상");
    const encodeSearchWord = encodeURIComponent(searchWord) + cookieWord;
    const urlBase = "https://search.naver.com/search.naver";
    const urlWhere = "?where="+where;
    const urlQuery = "&query="+encodeSearchWord;
    const url = urlBase+urlWhere+"&ie=utf8"+urlQuery;
    console.log("\n> URL : " + url + "\n");

    const setSearchPageURL = (pageNumber)=>{
        const result = [];

        for(let i = 0; i <= pageNumber; i++){
            if(i !== 0){
                result.push(url+"&start="+i+"1");
            }else{
                result.push(url);
            }
        }

        return result;
    };

    cheerio.fetch(url)
        .then(response => {
            const postNum = parseInt(response.$(".title_num").text().split(" / ")[1].split("건")[0]);
            const pageNum = Math.ceil( postNum / 10 - 1 );
            const urls = setSearchPageURL(pageNum);

            const resultInfo = {
                postNum,
                pageNum,
                urls
            };

            console.log("> 블로그 검색 결과 정보 : ", resultInfo.postNum + "개/", resultInfo.pageNum + "페이지/" , resultInfo.urls.length - 1 + "개의 검색 링크\n");

            return resultInfo;
        })
        .then(res => {
            //const searchURL = res.urls.splice(0,50);
            const searchURL = res.urls;

            const passQuery = {
                p : [
                    "쿠키", searchWord
                ],
                np : [
                    "스포",
                    "유무",
                    "?"
                ]
            };
            const passQueryLength = {
                p : passQuery.p.length,
                np : passQuery.np.length
            };

            const checkQuery = {
                p : [
                    {
                        str : "있",
                        score : 1
                    },
                    {
                        str : "있다",
                        score : 1
                    },
                    {
                        str : "있음",
                        score : 1
                    },
                    {
                        str : "있어요",
                        score : 1
                    },
                    {
                        str : "있습니다",
                        score : 1
                    }
                ],
                np : [
                    {
                        str : "없",
                        score : 1
                    },
                    {
                        str : "없다",
                        score : 1
                    },
                    {
                        str : "없음",
                        score : 1
                    },
                    {
                        str : "없어요",
                        score : 1
                    },
                    {
                        str : "없습니다",
                        score : 1
                    }
                ]
            };

            let pNum = 0;
            let npNum = 0;
            let pageCnt = 0;
            let postCnt = 0;

            const pageLength = searchURL.length; //length
            Promise.all(searchURL.map((url) => {
                pageCnt++;
                cheerio.fetch(url)
                    .then(response => {
                        const postLength = response.$(".type01 li").length; //length
                        response.$(".type01 li").map(function(){
                            postCnt++;
                            const title = response.$(this).find(".sh_blog_title").text();
                            //const content = response.$(this).find(".sh_blog_passage").text();


                            let passCheckNum = 0;
                            let passCheckResult = false;

                            //const passCheck =
                            passQuery.p.map(function(v){
                                if(title.indexOf(v) !== -1) {
                                    passCheckNum += 1;
                                }
                            });

                            if(passCheckNum === passQueryLength.p) {
                                passCheckResult = true;
                            }

                            //const npassCheck =
                            passQuery.np.map(function(v){
                                if(title.indexOf(v) !== -1) passCheckResult = false;
                            });

                            if(passCheckResult){
                                const filterStr = "쿠키" + title.split("쿠키")[1];

                                if(filterStr.indexOf("있") !== -1){
                                    console.log("> O : ", filterStr);
                                }
                                if(filterStr.indexOf("없") !== -1){
                                    console.log("> X : ", filterStr);
                                }


                                checkQuery.p.map(function(v){
                                    if(filterStr.indexOf(v.str) !== -1){
                                        pNum += v.score;
                                    }
                                });
                                checkQuery.np.map(function(v){
                                    if(filterStr.indexOf(v.str) !== -1){
                                        npNum += v.score;
                                    }
                                });
                            }
                        });
                        console.log(pageCnt, postCnt);
                        if(pageCnt === res.pageNum + 1  && postCnt === pageCnt*10){
                            console.log("\n> DONE");
                            console.log("  PASS : ", pNum);
                            console.log("  NO-PASS : ", npNum);

                            if(pNum > npNum){
                                console.log("= 쿠키영상 O");
                            }else if(pNum < npNum){
                                console.log("= 쿠키영상 X");
                            }else{
                                console.log("= 판별 불가")
                            }
                        }
                    });
            }));
        });

};
//naverSearch("post", "옥자");

/****************************************************************************************/


app.listen(portNumber, function() {
    console.log('\n* Server Start Port Number : ' + portNumber);
});