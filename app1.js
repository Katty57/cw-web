const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let mapManager = {
    mapData: null,
    tLayer: null, //if there are few layers then new Array()
    xCount: 0,
    yCount: 0,
    tSize: {x: 32, y:32},
    mapSize: {x: 32, y:32},
    tilesets: new Array(),
    level_num: 1,
    triangles: [],
    turnOn: 1,
    lose:false,
    labels:['Look around with the mouse, move with W/A/S/D','Turn on all cameras with SPACE'],
    parseMap(tilesJSON){
        this.mapData = JSON.parse(tilesJSON);
        this.xCount = this.mapData.width;
        this.yCount = this.mapData.height;
        this.tSize.x = this.mapData.tilewidth;
        this.tSize.y = this.mapData.tileheight;
        this.mapSize.x = this.xCount * this.tSize.x;
        this.mapSize.y = this.yCount * this.tSize.y;
        for(let i = 0; i < this.mapData.tilesets.length; i++) {
            let img = new Image();
            img.onload = function () {
                mapManager.imgLoadCount++;
                if (mapManager.imgLoadCount === mapManager.mapData.tilesets.length) {
                    mapManager.imgLoaded = true;
                }
            };
            img.src = this.mapData.tilesets[i].image;
            let t = this.mapData.tilesets[i];
            let ts = {
                firstgid: t.firstgid,
                image: img,
                name: t.name,
                xCount: Math.floor(t.imagewidth / mapManager.tSize.x),
                yCount: Math.floor(t.imageheight / mapManager.tSize.y)
            };
            this.tilesets.push(ts);
        }
        this.jsonLoaded = true;
    },
    draw(ctx){
        if(!mapManager.imgLoaded || !mapManager.jsonLoaded){
            setTimeout(function (){mapManager.draw(ctx);},100);
        }else{
            if(this.tLayer === null)
                for(let id = 0; id < this.mapData.layers.length; id++){
                    let layer = this.mapData.layers[id];
                    if(layer.type === "tilelayer"){
                        this.tLayer = layer;
                        break;
                    }
                }

            ctx.clearRect(0,0,canvas.width, canvas.height)
            for(let i = 0; i < this.tLayer.data.length; i++){
                if(this.tLayer.data[i] !== 0){
                    let tile = this.getTile(this.tLayer.data[i]);
                    let pX = (i%this.xCount) * this.tSize.x;
                    let pY = Math.floor(i/this.xCount)*this.tSize.y;
                    ctx.drawImage(tile.img, 0, 0, this.tSize.x, this.tSize.y, pX, pY, this.tSize.x, this.tSize.y);
                    for(let i = 0; i < gameManager.entities.length; i++){
                        if(gameManager.entities[i].name == 'LetGo'){
                            if(eventsManager.neigh(gameManager.player.pos_x + gameManager.player.size_x/2,
                                gameManager.player.pos_y + gameManager.player.size_y/2,
                                gameManager.entities[i].pos_x,gameManager.entities[i].pos_y,
                                gameManager.entities[i].size_x,gameManager.entities[i].size_y)){
                                    gameManager.frozen = true;
                            }
                        }
                    }
                    mapManager.triangles = []
                    ctx.drawImage(mapManager.enemyImg, 0, 0, gameManager.enemy.size_x, gameManager.enemy.size_y, gameManager.enemy.pos_x, gameManager.enemy.pos_y, gameManager.enemy.size_x, gameManager.enemy.size_y);
                    mapManager.drawAngle(gameManager.player.pos_x + gameManager.player.size_x/2, gameManager.player.pos_y + gameManager.player.size_y/2, mapManager.cur_x,mapManager.cur_y)
                    ctx.translate(gameManager.player.pos_x + (gameManager.player.size_x / 2), gameManager.player.pos_y+ (gameManager.player.size_y / 2))
                    ctx.rotate(gameManager.player.rotation);
                    ctx.drawImage(mapManager.playerImg, 0, 0, gameManager.player.size_x, gameManager.player.size_y, -gameManager.player.size_x/2, -gameManager.player.size_y/2, gameManager.player.size_x, gameManager.player.size_y);
                    ctx.rotate(-gameManager.player.rotation);
                    ctx.translate(-(gameManager.player.pos_x + (gameManager.player.size_x / 2)), -(gameManager.player.pos_y+ (gameManager.player.size_y / 2)))
                    ctx.fillStyle = 'rgba(255, 255, 126, 0.9)';
                    if(mapManager.level_num > 1) {
                        if (mapManager.turnOn % 2 == 0) {
                            mapManager.drawAngle(gameManager.lighter.pos_x + gameManager.lighter.size_x / 2, gameManager.lighter.pos_y + gameManager.lighter.size_y / 2, gameManager.lighter.pos_x + gameManager.lighter.size_x / 2, 0, 1 / 6 * Math.PI)
                        }
                        ctx.drawImage(mapManager.lighterImg, 0, 0, gameManager.lighter.size_x, gameManager.lighter.size_y, gameManager.lighter.pos_x, gameManager.lighter.pos_y, gameManager.lighter.size_x, gameManager.lighter.size_y)
                        for (let i = 0; i < gameManager.entities.length; i++) {
                            if (gameManager.entities[i].name == 'TurnOn') {
                                ctx.drawImage(mapManager.spaceImg, 0, 0, gameManager.entities[i].size_x, gameManager.entities[i].size_y, gameManager.entities[i].pos_x, gameManager.entities[i].pos_y, gameManager.entities[i].size_x, gameManager.entities[i].size_y)
                            }
                            if (gameManager.entities[i].name == 'root') {
                                ctx.drawImage(mapManager.rootImg, 0, 0, gameManager.entities[i].size_x, gameManager.entities[i].size_y, gameManager.entities[i].pos_x, gameManager.entities[i].pos_y, gameManager.entities[i].size_x, gameManager.entities[i].size_y)
                            }
                        }
                    }
                }
            }
        }
    },
    func(c_x, c_y, px, py, a,flag){
        if(flag == false)
            return ((a-px)*(c_y - py)/(c_x - px)) + py;
        else
            return ((a - py)*(c_x - px)/(c_y - py)) + px
    },
    len(x,y,px,py){
        return Math.sqrt((x - px)*(x - px)+(y - py)*(y - py))
    },
    sld(pos_x,pos_y,size_x,size_y,c_x,c_y, px,py,min_x){
        let x_for_0, y_for_0, x_for_h, y_for_w, x = -1,y = -1;
            x_for_0 = mapManager.func(c_x,c_y, px, py, pos_y, true)
            y_for_0 = mapManager.func(c_x,c_y, px, py, pos_x, false)
            x_for_h = mapManager.func(c_x,c_y, px, py,pos_y + size_y, true)
            y_for_w = mapManager.func(c_x,c_y, px, py,pos_x + size_x, false)

            if(x_for_0 == Infinity || x_for_h == Infinity || y_for_w == Infinity || y_for_0 == Infinity){
                return {min_x: x, min_y: y, min:min_x}
            }

            if (x_for_0 > pos_x && x_for_0 < pos_x + size_x)
                if(Math.sign(x_for_0 - px) == Math.sign(c_x - px) && (Math.sign(pos_y - py) == Math.sign(c_y - py)) && mapManager.len(x_for_0, pos_y,px,py) < min_x){
                    min_x = mapManager.len(x_for_0, pos_y,px,py);
                    x = x_for_0;
                    y = pos_y;
                }
            if (y_for_0 > pos_y && y_for_0 < pos_y + size_y)
                if(Math.sign(y_for_0 - py) == Math.sign(c_y - py) && (Math.sign(pos_x - px) == Math.sign(c_x - px)) && mapManager.len(pos_x, y_for_0,px,py) < min_x){
                    min_x = mapManager.len(pos_x, y_for_0,px,py);
                    x = pos_x;
                    y = y_for_0;
                }
            if (x_for_h > pos_x && x_for_h < pos_x + size_x)
                if(Math.sign(x_for_h - px) == Math.sign(c_x - px) && (Math.sign(pos_y + size_y/2 - py) == Math.sign(c_y - py)) && mapManager.len(x_for_h, pos_y + size_y,px,py) < min_x){
                    min_x = mapManager.len(x_for_h, pos_y + size_y,px,py);
                    x = x_for_h;
                    y = pos_y + size_y;
                }
            if (y_for_w > pos_y && y_for_w < pos_y + size_y)
                if(Math.sign(y_for_w - py) == Math.sign(c_y - py) && (Math.sign(pos_x + size_x/2 - px) == Math.sign(c_x - px)) && mapManager.len(pos_x +size_x, y_for_w,px,py) < min_x){
                    min_x = mapManager.len(pos_x + size_x, y_for_w,px,py);
                    x = pos_x + size_x;
                    y = y_for_w;
                }

        return {min_x: x, min_y: y, min:min_x}
    },
    drawAngle(px,py,cyr_x,cyr_y,ang = Math.PI/3){
        let min_x = Math.max(canvas.width,canvas.height);
        let r_x, r_y;
        r_x = (cyr_x - px) * Math.cos(ang) - (cyr_y - py)*Math.sin(ang) + px;
        r_y = (cyr_x - px) * Math.sin(ang) + (cyr_y - py)*Math.cos(ang) + py;
        let obj1;
        for(let i = 0; i < gameManager.collision.length; i++) {
            let obj2 = Object.create(mapManager.sld(gameManager.collision[i].pos_x,gameManager.collision[i].pos_y,gameManager.collision[i].size_x,gameManager.collision[i].size_y,r_x, r_y, px,py,min_x))
            if(obj2.min < min_x){
                min_x = obj2.min
                obj1 = obj2
            }
        }
        let l_x, l_y;
        l_x = (cyr_x - px) * Math.cos(-ang) - (cyr_y - py)*Math.sin(-ang) + px;
        l_y = (cyr_x - px) * Math.sin(-ang) + (cyr_y - py)*Math.cos(-ang) + py;
        let object1;
        min_x = Math.max(canvas.width,canvas.height)
        for(let i = 0; i < gameManager.collision.length; i++) {
            let obj2 = Object.create(mapManager.sld(gameManager.collision[i].pos_x,gameManager.collision[i].pos_y,gameManager.collision[i].size_x,gameManager.collision[i].size_y,l_x, l_y, px,py,min_x))
            if(obj2.min < min_x){
                min_x = obj2.min
                object1 = obj2
            }
        }

        mapManager.triangles.push({
            x1: px,
            y1: py,
            x2: obj1.min_x,
            y2: obj1.min_y,
            x3: object1.min_x,
            y3: object1.min_y
        })
        ctx.beginPath();
        ctx.moveTo(px, py)
        ctx.lineTo(obj1.min_x, obj1.min_y)
        ctx.lineTo(object1.min_x, object1.min_y)
        ctx.fill()
    },
    findAngle(px,py,cx,cy,ang1,ang2){
        if(px < cx)
            return (Math.atan((cy - py)/(cx - px))) + ang1;
        else
            return (Math.atan((cy - py)/(cx - px))) + ang2;
    },
    go(aim_x,aim_y,b_x,b_y,mv_x,mv_y){
        let got_x = b_x + mv_x * gameManager.enemy.size_x
        let got_y = b_y + mv_y * gameManager.enemy.size_y;
        if(eventsManager.check(got_x,got_y) == false){
            gameManager.enemy.pos_x = got_x
            gameManager.enemy.pos_y = got_y
        }
    },
    checkEnemy(aim_x,aim_y,b_x,b_y){
        if(eventsManager.neigh(aim_x,aim_y,b_x-gameManager.enemy.size_x/2,b_y-gameManager.enemy.size_x/2,gameManager.enemy.size_x*2,gameManager.enemy.size_y*2)
        || eventsManager.neigh(aim_x + gameManager.player.size_x,aim_y,b_x-gameManager.enemy.size_x/2,b_y-gameManager.enemy.size_x/2,gameManager.enemy.size_x*2,gameManager.enemy.size_y*2)
            || eventsManager.neigh(aim_x,aim_y + gameManager.player.size_y,b_x-gameManager.enemy.size_x/2,b_y-gameManager.enemy.size_x/2,gameManager.enemy.size_x*2,gameManager.enemy.size_y*2)
            || eventsManager.neigh(aim_x + gameManager.player.size_x,aim_y + gameManager.player.size_y,b_x-gameManager.enemy.size_x/2,b_y-gameManager.enemy.size_x/2,gameManager.enemy.size_x*2,gameManager.enemy.size_y*2)){
            mapManager.lose = true
            clearInterval(mapManager.refreshIntervalId)
            window.location.href="index.html";
        }
        let line_op = Math.abs(aim_x - b_x)
        let line_near = Math.abs(aim_y - b_y)
        let t = 0, s = 0
        if(line_near < Math.max(gameManager.enemy.size_x,gameManager.enemy.size_y)){
            line_near = line_op
        }else if(line_op < Math.max(gameManager.enemy.size_x,gameManager.enemy.size_y)){
            line_op = line_near + 1
        }

        if(line_op <= line_near){
            if(b_x > aim_x){
                t = -1
            }
            if(b_x < aim_x){
                t = 1
            }
        }else{
            if(b_y > aim_y){
                s = -1
            }
            if(b_y < aim_y){
                s = 1
            }
        }

        let pos_x = b_x + t * gameManager.enemy.size_x/8
        let pos_y = b_y + s * gameManager.enemy.size_y/8

        if(mapManager.makeEnemy(pos_x,pos_y) == true && mapManager.makeEnemy(pos_x - gameManager.enemy.size_x/2,pos_y - gameManager.enemy.size_y/2) == true &&
            mapManager.makeEnemy(pos_x- gameManager.enemy.size_x/2,pos_y+ gameManager.enemy.size_x/2) == true && mapManager.makeEnemy(pos_x+ gameManager.enemy.size_x/2,pos_y- gameManager.enemy.size_y/2) == true &&
            mapManager.makeEnemy(pos_x+ gameManager.enemy.size_x/2,pos_y+ gameManager.enemy.size_x/2) == true){
            eventsManager.update(gameManager.enemy,t,s)
        }else{
            gameManager.enemy.move_x = 0
            gameManager.enemy.move_y = 0
        }
    },
    mvEnemy(aim_x,aim_y,b_x,b_y){
        if(b_x > aim_x){
            gameManager.enemy.move_x = -1;
            gameManager.enemy.move_y = 0;
            eventsManager.update(gameManager.enemy)
        }else
        if(b_x > aim_x){
            gameManager.enemy.move_x = 1;
            gameManager.enemy.move_y = 0
            eventsManager.update(gameManager.enemy)
        }else
        if(b_y > aim_y){
            gameManager.enemy.move_x = 0
            gameManager.enemy.move_y = -1;
            eventsManager.update(gameManager.enemy)
        }else
        if(b_y < aim_y){
            gameManager.enemy.move_x = 0
            gameManager.enemy.move_y = 1;
            eventsManager.update(gameManager.enemy)
        }
    },
    moveEnemy(){
        let px = gameManager.enemy.pos_x + gameManager.enemy.size_x/2;
        let py = gameManager.enemy.pos_y + gameManager.enemy.size_y/2
        let gx, gy;
        ctx.clearRect(gameManager.enemy.pos_x, gameManager.enemy.pos_y, gameManager.player.size_x, gameManager.enemy.size_y)
                    if((gameManager.enemy.pos_x + gameManager.enemy.size_x/2) > (gameManager.player.pos_x + gameManager.player.size_x/2)) {
                        gy = mapManager.func(px, py, gameManager.player.pos_x + gameManager.player.size_x / 2, gameManager.player.pos_y - gameManager.player.size_y / 2, px - gameManager.enemy.size_x, false)
                        gx = px - gameManager.enemy.size_x
                    }else if((gameManager.enemy.pos_x + gameManager.enemy.size_x/2) < (gameManager.player.pos_x + gameManager.player.size_x/2)){
                        gy = mapManager.func(px, py, gameManager.player.pos_x + gameManager.player.size_x / 2, gameManager.player.pos_y + gameManager.player.size_y / 2, px + gameManager.enemy.size_x, false)
                        gx = px- gameManager.enemy.size_x
                    }else{
                        if((gameManager.enemy.pos_y + gameManager.enemy.size_y/2) > (gameManager.player.pos_y + gameManager.player.size_y/2)){
                            gx = mapManager.func(px, py, gameManager.player.pos_x + gameManager.player.size_x / 2, gameManager.player.pos_y + gameManager.player.size_y / 2, py - gameManager.enemy.size_y, true)
                            gy = py- gameManager.enemy.size_y
                        }else{
                            gx = mapManager.func(px, py, gameManager.player.pos_x + gameManager.player.size_x / 2, gameManager.player.pos_y + gameManager.player.size_y / 2, py + gameManager.enemy.size_y, true)
                            gy = py- gameManager.enemy.size_y
                        }
                    }
        let min_x = canvas.width, obj_g,object = Object.create(null)

        let object_ = Object.create(null)
        let object_op = Object.create(null)
        let object_near = Object.create(null)

        for(let i = 0; i < gameManager.collision.length; i++) {
            let obj = Object.create(mapManager.sld(gameManager.collision[i].pos_x, gameManager.collision[i].pos_y, gameManager.collision[i].size_x, gameManager.collision[i].size_y, gameManager.player.pos_x + gameManager.player.size_x/2,gameManager.player.pos_y + gameManager.player.size_y/2,gx, gy,  min_x))
            if(min_x > obj.min){
                min_x = obj.min
                obj_g = obj
                object_ = gameManager.collision[i]
            }
        }
        if(min_x != canvas.width){
            object = object_
            min_x = canvas.width
            for(let i = 0; i < gameManager.collision.length; i++) {
                let obj = Object.create(mapManager.sld(gameManager.collision[i].pos_x, gameManager.collision[i].pos_y, gameManager.collision[i].size_x, gameManager.collision[i].size_y, gameManager.player.pos_x + gameManager.player.size_x/2,gy,gx, gy,  min_x))
                if(min_x > obj.min){
                    min_x = obj.min
                    obj_g = obj
                    object_op = gameManager.collision[i]
                }
            }
            //console.log("choose object_op", gx,gy,object_op)
        }
        if(min_x != canvas.width){
            object = object_op
            min_x = canvas.width
            for(let i = 0; i < gameManager.collision.length; i++) {
                let obj = Object.create(mapManager.sld(gameManager.collision[i].pos_x, gameManager.collision[i].pos_y, gameManager.collision[i].size_x, gameManager.collision[i].size_y, gx,gameManager.player.pos_y + gameManager.player.size_y/2,gx, gy,  min_x))
                if(min_x > obj.min){
                    min_x = obj.min
                    obj_g = obj
                    object_near = gameManager.collision[i]
                }
            }
            //console.log("choose object_near")
        }
        if(min_x != canvas.width){
            //console.log("not good")
            object = object_near
        }else{
            gameManager.enemy.pos_x = gx;
            gameManager.enemy.pos_y = gy;
        }
    },
    makeEnemy(pos_x,pos_y){

        let flag1 = false, flag2 = false;
        for(let i = 0; i < mapManager.triangles.length; i++){
            let ang1,ang2,ang3, ang11, ang12, ang13;

            //for y axis
            ang1 = mapManager.findAngle(mapManager.triangles[i].x1, mapManager.triangles[i].y1, mapManager.triangles[i].x3,mapManager.triangles[i].y3, Math.PI/2, -Math.PI/2)
            ang2 = mapManager.findAngle(mapManager.triangles[i].x1, mapManager.triangles[i].y1, pos_x + gameManager.enemy.size_x/2, pos_y + gameManager.enemy.size_y/2, Math.PI/2, -Math.PI/2)
            ang3 = mapManager.findAngle(mapManager.triangles[i].x1, mapManager.triangles[i].y1, mapManager.triangles[i].x2,mapManager.triangles[i].y2, Math.PI/2, -Math.PI/2)
            if(ang2 > ang1 && ang2 < ang3)
                flag1 = true;

            //for x axis
            //let w = canvas.width, h = 0
            //ctx.translate(w,h)
            ang11 = mapManager.findAngle(mapManager.triangles[i].x3, mapManager.triangles[i].y3, mapManager.triangles[i].x2,mapManager.triangles[i].y2, 0,0)
            ang12 = mapManager.findAngle(mapManager.triangles[i].x3, mapManager.triangles[i].y3, (pos_x + gameManager.enemy.size_x/2), (pos_y + gameManager.enemy.size_y/2), 0,0)
            ang13 = mapManager.findAngle(mapManager.triangles[i].x3, mapManager.triangles[i].y3, mapManager.triangles[i].x1,mapManager.triangles[i].y1, 0,0)
            //ctx.translate(-w,-h)
            if(ang12 > ang11 && ang12 < ang13)
                flag2 = true

        }
        return flag1 == false || flag2 == false
            //console.log("class")
    },
    isVisible(x, y, width, height) {
        if(x + width < this.view.x || y + height < this.view.y || x > this.view.x + this.view.w || y > this.view.y + this.view.h)
            return false;
        return true;
    },
    getTile(tileIndex) {
        let tile = {
            img: null,
            px:0, py:0
        };
        let tileset = this.getTileset(tileIndex);
        tile.img = tileset.image;
        let id = tileIndex - tileset.firstgid;
        let x = id % tileset.xCount;
        let y = Math.floor(id/tileset.xCount);
        tile.px = x*this.tSize.x;
        tile.py = y*this.tSize.y;
        return tile;
    },
    getTileset(tileIndex){
        for(let i = this.tilesets.length - 1; i >= 0 ; i--)
            if(this.tilesets[i].firstgid <= tileIndex){
                return this.tilesets[i];
            }
        return null;

    },
    loadedImag(a,b,file){
        if (!this.imgLoaded) {
            let img = new Image();
            img.onload = function () {
                a = true;
                b = img;
            };
            img.src = file;
        }
    },
    loadMap(path){
        let req = new XMLHttpRequest();
        req.onreadystatechange = function(){
            if(req.readyState === 4 && req.status === 200){
                mapManager.parseMap(req.responseText);
            }
        };
        req.open("GET", path, true);
        req.send();


        let q = 0;
        let txt = mapManager.labels[mapManager.level_num - 1];  /* The speed/duration of the effect in milliseconds */
        document.getElementById("label").innerHTML = ""

        function typeWriter() {
            if (q < txt.length) {
                document.getElementById("label").innerHTML += txt.charAt(q);
                q++;
                setTimeout(typeWriter, 50);
            }
        }

        typeWriter();

        if (!this.imgLoaded) {
            let img = new Image();
            img.onload = function () {
                mapManager.playerLoaded = true;
                mapManager.playerImg = img;
            };
            img.src = "chicken.png";
        }
        if (!this.imgLoaded) {
            let img = new Image();
            img.onload = function () {
                mapManager.enemyLoaded = true;
                mapManager.enemyImg = img;
            };
            img.src = "enemy.png";
        }
        if (!this.imgLoaded && mapManager.level_num > 1) {
            let img = new Image();
            img.onload = function () {
                mapManager.lighterLoaded = true;
                mapManager.lighterImg = img;
            };
            img.src = "lighter.png";
        }
        if (!this.imgLoaded && mapManager.level_num > 1) {
            let img = new Image();
            img.onload = function () {
                mapManager.rootLoaded = true;
                mapManager.rootImg = img;
            };
            img.src = "root.png";
        }
        if (!this.imgLoaded && mapManager.level_num > 1) {
            gameManager.frozen = true;
            let img = new Image();
            img.onload = function () {
                mapManager.spaceLoaded = true;
                mapManager.spaceImg = img;
            };
            img.src = "space.png";
        }
    },
    jsonLoaded: false,
    imgLoaded: false,
    playerLoaded: false,
    playerImg: null,
    enemyLoaded: false,
    enemyImg: null,
    spaceLoaded: false,
    spaceImg: null,
    lighterLoaded: false,
    lighterImg: null,
    rootLoaded: false,
    rootImg: null,
    cur_x: 0,
    cur_y: 0,
    imgLoadCount: 0,
    view: {x:0,y:0,w:1000,h:1000},
    parseEntities(){
        if(!mapManager.imgLoaded || !mapManager.jsonLoaded){
            setTimeout(function () {
                mapManager.parseEntities();
            },100);
        }else{
            for(let j = 0; j < this.mapData.layers.length; j++)
                if(this.mapData.layers[j].type === 'objectgroup'){
                    let entities = this.mapData.layers[j];
                    for(let i = 0; i < entities.objects.length; i++){
                        let e = entities.objects[i];
                        //console.log(e)
                        try{
                            let obj = Object.create(null);
                            obj.name = e.name;
                            //console.log(obj.name)
                            obj.pos_x = e.x;
                            obj.pos_y = e.y;
                            obj.move_x = 0;
                            obj.move_y = 0;
                            obj.b1 = 0;
                            obj.b2 = 0;
                            obj.rotation = e.rotation;
                            obj.size_x= e.width;
                            obj.size_y = e.height;
                            if(obj.name === 'Solid'){
                                gameManager.collision.push(obj);
                            }else {
                                gameManager.entities.push(obj);
                                //gameManager.factory[e.type] = obj;
                                if (obj.name === "StartPoint") {
                                    //console.log("hiiii")
                                    gameManager.initEnt(obj,true);
                                }else
                                if(obj.name === "Enemy"){
                                    gameManager.initEnt(obj,false)
                                }else
                                if(obj.name == "Lighter"){
                                    gameManager.lighter = obj;
                                }else
                                if(obj.name == 'FinishPoint'){
                                    gameManager.finish = obj;
                                }
                            }
                        }catch(ex){
                            console.log("Error while creating:[" + e.gid + "]" + e.type + "," + ex);
                        }
                    }
                }
        }
    },
    clearAll(){
        mapManager.mapData = null
        mapManager.tLayer = null
        mapManager.xCount = 0;
        mapManager.yCount = 0;
        mapManager.tSize = {x:32, y:32}
        mapManager.mapSize = {x:32, y:32}
        mapManager.tilesets = new Array()
        mapManager.triangles = [];
        mapManager.turnOn = 1;
        mapManager.lose = false;
        mapManager.jsonLoaded = false
        mapManager.imgLoaded = false
        mapManager.playerLoaded = false
        mapManager.playerImg = null
        mapManager.enemyLoaded = false
        mapManager.enemyImg = null
        mapManager.spaceLoaded = false
        mapManager.spaceImg = null
        mapManager.lighterLoaded = false
        mapManager.lighterImg = null
        mapManager.rootLoaded = false
        mapManager.rootImg = null
        mapManager.cur_x = 0
        mapManager.cur_y = 0
        mapManager.imgLoadCount = 0
        mapManager.view = {x:0,y:0,w:1000,h:1000}
        eventsManager.bind = []
        eventsManager.action = []
        gameManager.factory = {}
        gameManager.entities = []
        gameManager.collision = []
        gameManager.fireNum = 0;
        gameManager.player = null
        gameManager.finish = null
        gameManager.enemy = null
        gameManager.lighter = null
        gameManager.laterKill = []
        gameManager.win = false
    },
    highscoreList:[],
    playerName:'',
    playerLevel:0,
    toHighscoreList() {
        if(localStorage.getItem('table') != null){
            mapManager.highscoreList= JSON.parse(localStorage["table"]);
        }
        mapManager.playerName = localStorage["chicken.username"];
        mapManager.playerLevel = mapManager.level_num - 1;

        mapManager.highscoreList.push({player: mapManager.playerName, level: mapManager.playerLevel});
        mapManager.highscoreList.sort(function(a,b) { return (b.level - a.level) });
        localStorage["table"]=JSON.stringify(mapManager.highscoreList);
    },
    printList(){
        //console.log(localStorage["chicken.username"], mapManager.level_num)
        mapManager.toHighscoreList();
        let x = document.createElement("table");
        x.setAttribute("id", "myTable");
        x.setAttribute("class","recor_table");
        document.body.appendChild(x);

        document.getElementById("myTable").style.border='1px solid #C9CBCD';
        document.getElementById("myTable").style.padding='15px';

        let y = document.createElement("tr");
        y.setAttribute("id", "myTr");
        document.getElementById("myTable").appendChild(y);
        let z1 = document.createElement("td");
        let t1 = document.createTextNode("Place");
        z1.appendChild(t1);
        document.getElementById("myTr").appendChild(z1);

        let z2 = document.createElement("td");
        let t2 = document.createTextNode("Player");
        z2.appendChild(t2);
        document.getElementById("myTr").appendChild(z2);

        let z3 = document.createElement("td");
        let t3 = document.createTextNode("Level");
        z3.appendChild(t3);
        document.getElementById("myTr").appendChild(z3);

        for(let i = 0; i < mapManager.highscoreList.length; i++){
            let y1 = document.createElement("tr");
            y1.setAttribute("id", "myTr" + i);
            document.getElementById("myTable").appendChild(y1);
            let k = document.createElement("td");
            let num = i + 1;
            let l = document.createTextNode(''+num);
            k.appendChild(l);
            document.getElementById("myTr" + i).appendChild(k);
            for(let j = 0; j < Object.values(mapManager.highscoreList[i]).length; j++){
                let z1 = document.createElement("td");
                let t1 = document.createTextNode(''+(Object.values(mapManager.highscoreList[i]))[j]);
                z1.appendChild(t1);
                document.getElementById("myTr" + i).appendChild(z1);
            }

        }
    }
}

var eventsManager = {
    bind:[],
    action:[],
    setup(canvas){
        this.bind[87]='up';
        this.bind[65]='left';
        this.bind[83]='down';
        this.bind[68]='right';
        this.bind[38]='up';
        this.bind[37]='left';
        this.bind[40]='down';
        this.bind[39]='right';
        this.bind[13]='rotate';
        this.bind[32]='space';
    },
    onKeyDown(event){
        let action = eventsManager.bind[event.keyCode];
        if(action){
            eventsManager.action[action] = true;

        }
    },
    onKeyUp(event){
        let action = eventsManager.bind[event.keyCode];
        if(action)
            eventsManager.action[action] = false;
        if(eventsManager.bind[event.keyCode] == 'space'){
            soundManager.time = 2
            soundManager.loadSound("Light-Turning-On-A1.wav")
            mapManager.turnOn += 1
        }
    },
    mouseDown(event){
        mapManager.cur_x = event.pageX;
        mapManager.cur_y = event.pageY
    },
    mouseMove(event){
        mapManager.cur_x = event.pageX;
        mapManager.cur_y = event.pageY
        gameManager.player.rotation = mapManager.findAngle(gameManager.player.pos_x + (gameManager.player.size_x/2),gameManager.player.pos_y + (gameManager.player.size_y/2), mapManager.cur_x, mapManager.cur_y, Math.PI/2, -Math.PI/2)
        ctx.clearRect(gameManager.player.pos_x, gameManager.player.pos_y, gameManager.player.size_x * 2, gameManager.player.size_y * 2);
        mapManager.draw(ctx);
    },
    neigh(x,y,pos_x,pos_y,size_x,size_y){
        if(x > pos_x
            && x < pos_x + size_x
            && y > pos_y
            && y < pos_y + size_y) {
            return true;
        }
        return false
    },
    check(pos_x, pos_y){
        gameManager.win = eventsManager.neigh(pos_x,pos_y,gameManager.finish.pos_x,gameManager.finish.pos_y,
            gameManager.finish.size_x,gameManager.finish.size_y)
        for(let i = 0; i < gameManager.collision.length; i++){
            if(eventsManager.neigh(pos_x,pos_y,gameManager.collision[i].pos_x,gameManager.collision[i].pos_y,
                gameManager.collision[i].size_x,
                gameManager.collision[i].size_y)) {
                return true;
            }
        }
        return false;
    },
    update(obj,t,s,a=8,b=1){
        let motion_x = obj.pos_x + (t * obj.size_x/a);
        let motion_y = obj.pos_y + (s * obj.size_y/a);
        let flag = this.check(motion_x,motion_y) || this.check(motion_x + obj.size_x,motion_y)
            || this.check(motion_x,motion_y + obj.size_y) || this.check(motion_x + obj.size_x,motion_y + obj.size_y);
        ctx.clearRect(obj.pos_x, obj.pos_y, obj.size_x * b, obj.size_y * b);
        if(flag == false)
            obj.pos_x = motion_x;
        else
            obj.move_x = 0;
        if(flag == false)
            obj.pos_y = motion_y;
        else
            obj.move_y = 0;
    }
}

document.addEventListener("keydown", eventsManager.onKeyDown);
document.addEventListener("keyup", eventsManager.onKeyUp);
document.addEventListener("mousemove", eventsManager.mouseMove);

var gameManager = {
    factory:{},
    frozen:false,
    entities:[],
    collision: [],
    fireNum:0,
    player:null,
    finish:null,
    enemy: null,
    lighter:null,
    laterKill:[],
    win: false,
    initEnt:function (obj,flag) {
        if(flag)
            this.player = obj;
        else
            this.enemy = obj;
    },
    kill: function (obj) {
        this.laterKill.push(obj);
    },
    update: function(){
        if(this.player === null)
            return;
        this.player.move_x = 0;
        this.player.move_y = 0;
        if(eventsManager.action["up"])
            this.player.move_y = -1;
        if(eventsManager.action["down"])
            this.player.move_y = 1;
        if(eventsManager.action["left"])
            this.player.move_x = -1;
        if(eventsManager.action["right"])
            this.player.move_x = 1;
        eventsManager.update(this.player,gameManager.player.move_x,gameManager.player.move_y,8,2)
        mapManager.draw(ctx);
    },
    draw: function (ctx) {
        for (let e = 0; e < this.entities.length; e++) {

            this.entities[e].draw(ctx);
        }
    },
    loadAll: function () {
        mapManager.clearAll()
        mapManager.loadMap("tileMap" + mapManager.level_num + ".json");//распарсила карту
        mapManager.parseEntities();
        mapManager.draw(ctx);
        eventsManager.setup(ctx);
    },
    updateEnemy(){
        if(!gameManager.frozen)
            return
        if(mapManager.level_num > 2)
            return;
        mapManager.checkEnemy(gameManager.player.pos_x + gameManager.player.size_x/2,gameManager.player.pos_y + gameManager.player.size_y/2, gameManager.enemy.pos_x + gameManager.enemy.size_x/2, gameManager.enemy.pos_y+gameManager.enemy.size_y/2)
        ctx.drawImage(mapManager.enemyImg, 0, 0, gameManager.enemy.size_x, gameManager.enemy.size_y, gameManager.enemy.pos_x, gameManager.enemy.pos_y, gameManager.enemy.size_x, gameManager.enemy.size_y);
    },
    play:function () {
        if(mapManager.level_num > 2)
            return;
        mapManager.refreshIntervalId = setInterval(updateWorld,60);
        mapManager.refreshIntervalId1 = setInterval(gameManager.updateEnemy, 10)
    }
}

let context = new AudioContext();

var soundManager = {
    time:0,
    loadSound(url){
        let req = new XMLHttpRequest();
        req.open('GET',url,true)
        req.responseType = 'arraybuffer'
        req.onload = function () {
            context.decodeAudioData(req.response,
                function (buffer) {
                    soundManager.playSound(buffer)
                })
        }
        req.send()
    },
    playSound(buffer){
        let sound = context.createBufferSource()
        sound.buffer = buffer
        sound.connect(context.destination)
        if(!sound.start)
            sound.start = sound.noteOn
        let now = context.currentTime
        sound.start(now)
        sound.stop(now + soundManager.time)
    }
}

function updateWorld(){
    if(gameManager.win == true){
        soundManager.time = 10;
        soundManager.loadSound("Take a Chance.wav")
        mapManager.level_num += 1;
        if(mapManager.lose){
            clearInterval(mapManager.refreshIntervalId)
            window.location.href="index.html";
        }
        if(mapManager.level_num > 2){
            clearInterval(mapManager.refreshIntervalId);
            clearInterval(mapManager.refreshIntervalId1)
            //console.log(mapManager.level_num)
            document.getElementById("label").innerHTML = ""
            mapManager.printList()
            return;
        }else {
            gameManager.win = false
            gameManager.loadAll()
            return;
        }
        return;
    }
    gameManager.update()
}

gameManager.loadAll();
gameManager.play();