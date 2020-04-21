	var express = require('express'); 
    var app = express(); 
    var bodyParser = require('body-parser');
    var multer = require('multer');
    var xlstojson = require("xls-to-json-lc");
    var xlsxtojson = require("xlsx-to-json-lc");
    var https = require('https');
    

    app.use(bodyParser.json());  

    var storage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            cb(null, './uploads/')
        },
        filename: function (req, file, cb) {
            var datetimestamp = Date.now();
            cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
        }
    });

    var upload = multer({ //multer settings
                    storage: storage,
                    fileFilter : function(req, file, callback) { //file filter
                        if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length-1]) === -1) {
                            return callback(new Error('Wrong extension type'));
                        }
                        callback(null, true);
                    }
                }).single('file');

    /** API path that will upload the files */
    app.post('/upload', function(req, res) {
        var exceltojson;
        upload(req,res,function(err){
            if(err){
                 res.json({error_code:1,err_desc:err});
                 return;
            }
            /** Multer gives us file info in req.file object */
            if(!req.file){
                res.json({error_code:1,err_desc:"No file passed"});
                return;
            }
            /** Check the extension of the incoming file and 
             *  use the appropriate module
             */
            if(req.file.originalname.split('.')[req.file.originalname.split('.').length-1] === 'xlsx'){
                exceltojson = xlsxtojson;
            } else {
                exceltojson = xlstojson;
            }
            console.log(req.file.path);
            try {
                exceltojson({
                    input: req.file.path,
                    output: null, //since we don't need output.json
                    lowerCaseHeaders:true
                }, function(err,result){
                    if(err) {
                        return res.json({error_code:1,err_desc:err, data: null});
                    } 
                    res.json({error_code:0,err_desc:null, data: result});
                });
            } catch (e){
                res.json({error_code:1,err_desc:"Corupted excel file"});
            }
        })
       
    });

    // Configuring body parser middleware
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    app.post('/requestfile', function(req, res) {
        var options = {
            hostname: 'api.box.com',
            port: 443,
            path: '/2.0/files/'+req.body.file_id+'/content',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+req.body.token
            }
        }
        const req2 = https.request(options, res2 => {
            console.log(`statusCode box: ${res2.statusCode}`)
            console.log(`download link: ${res2.headers.location}`)
            var options2 = {
                hostname: 'cclugo.info',
                port: 443,
                path: '/data?url='+res2.headers.location,
                method: 'GET'
            }
            var req3 = https.request(options2, res3 => {
                console.log(`statusCode cclugo: ${res3.statusCode}`)
                //console.log(res3)
                //console.dir(res3, { depth: null });
                console.log('method: '+res3.method, 'url: '+res3.url, 'headers: '+res3.headers);
                let body = '';
                res3.on('data', (chunk) => {
                    body += chunk;
                });
                res3.on('end', () => {
                    console.log(body);
                    res.send(body)
                    //s.write('OK'); // s is req3
                    //s.end(); 
                });
                // res3.on('data', d => {
                //     process.stdout.write(d)
                //     console.log(d)
                // })
            })
            req3.on('error', error => {
                console.error(error)
            })
            //console.log('req3: '+req3)

            req3.end()
            //console.log(res2)
            //console.dir(res2, { depth: null });
            // res2.on('data', d => {
            //     process.stdout.write(d)
            // })
        })
        req2.on('error', error => {
            console.error(error)
        })
        req2.end()
        
        //res.send('body');
    });
	
	app.get('/',function(req,res){
		res.sendFile(__dirname + "/index.html");
	});

    app.listen('3000', function(){
        console.log('running on 3000...');
    });