var canvas, stage, exportRoot, anim_container, dom_overlay_container, fnStartAnimation;
function init() {
	canvas = document.getElementById("canvas");
	anim_container = document.getElementById("animation_container");
	dom_overlay_container = document.getElementById("dom_overlay_container");
	var comp=AdobeAn.getComposition("5E4E8E2A3E21B941AD2FD09DEDB019DF");
	var lib=comp.getLibrary();
	var loader = new createjs.LoadQueue(false);
	loader.addEventListener("fileload", function(evt){handleFileLoad(evt,comp)});
	loader.addEventListener("complete", function(evt){handleComplete(evt,comp)});
	var lib=comp.getLibrary();
	loader.loadManifest(lib.properties.manifest);
}
function handleFileLoad(evt, comp) {
	var images=comp.getImages();	
	if (evt && (evt.item.type == "image")) { images[evt.item.id] = evt.result; }	
}
function handleComplete(evt,comp) {
	//This function is always called, irrespective of the content. You can use the variable "stage" after it is created in token create_stage.
	var lib=comp.getLibrary();
	var ss=comp.getSpriteSheet();
	var queue = evt.target;
	var ssMetadata = lib.ssMetadata;
	for(i=0; i<ssMetadata.length; i++) {
		ss[ssMetadata[i].name] = new createjs.SpriteSheet( {"images": [queue.getResult(ssMetadata[i].name)], "frames": ssMetadata[i].frames} )
	}
	exportRoot = new lib.mario();
	stage = new lib.Stage(canvas);

	// 遊戲參數
	const SPEED = 10; 		// 移動速度 		越高越快
	const ATTACK = 25; 		// 受到傷害 		越高越痛
	let Hp = 100; 			// 血量
	let difficulty = 3; 	// 難度 (0 ~ 30) 	越高越難
	let dropSpeed = 2500; 	// 掉落數度	4000 ~ 1500		越高越慢 avg 250
	let newSpeed = 110;		// 掉落數量 200 ~ 50		越高越少 avg 12
	let getHeart = 100;		// 每 x 分 掉一顆愛心
	const level = [
		{lv:1, difficulty:3, score:200},
		{lv:2, difficulty:6, score:400},
		{lv:3, difficulty:9, score:600},
		{lv:4, difficulty:12, score:800},
		{lv:5, difficulty:15, score:1000},
		{lv:6, difficulty:18, score:1200},
		{lv:7, difficulty:21, score:1400},
		{lv:8, difficulty:24, score:1600},
		{lv:9, difficulty:27, score:1800},
		{lv:10, difficulty:30, score:2000},
	];

	// 遊戲變數
	let partyNumber = 20;
	let levelCount = 0;
	let position = 1;
	let isKeydown = false;
	let score = 0;
	let dropScore = getHeart;
	let isStart = false;
	let isJump = false;
	let HeartDropped = false;
	let showLevel = document.getElementById('level');
	var BgSound = {};
	var Mario = new lib.Mario();
	Mario.x = 345;
	Mario.y = 370;
	exportRoot.addChild(Mario);

	// Sound loading
	const sounds = [
		{src:"./sound/hit.mp3", id:"hit"},
		{src:"./sound/coin.mp3", id:"coin"},
		{src:"./sound/gameOver.mp3", id:"over"},
		{src:"./sound/bg.mp3", id:"bg"},
		{src:"./sound/addHp.mp3", id:"addHp"},
	];
	createjs.Sound.alternateExtensions = ["mp3"];
	createjs.Sound.registerSounds(sounds, "./");

	// Drop Object
	let timeElement = setInterval(setInFn, newSpeed);
	function setInFn(){
		if(!isStart) return;
		let addTag;
		let Element;
		let random = Math.floor(Math.random() * 100);
		// ice cream
		if(random === 0){
			let IceCream = new lib.IceCream();
			IceCream.x = Math.floor(Math.random() * (670-30) + 30);
			IceCream.y = -50;
			exportRoot.addChildAt(IceCream, 2);
			createjs.Tween.get(IceCream)
			.to({y:600}, dropSpeed*1.8)
			.call(()=>{
				exportRoot.removeChild(IceCream);
			})
			.addEventListener("change",()=>{
				let startParty = ndgmr.checkRectCollision(IceCream, Mario);
				if(startParty) {
					createjs.Tween.removeTweens(IceCream); //移除金幣動畫
					exportRoot.removeChild(IceCream); // remove Element Object
					party((levelCount+1) * partyNumber);
				}
			})
		}
		// coin and boom
		if(random > difficulty){
			Element = new lib.Coin();
			addTag = true;
			exportRoot.addChildAt(Element, 1);
		}else{
			Element = new lib.Boom();
			addTag = false;
			exportRoot.addChildAt(Element, 3);
		}
		Element.x = Math.floor(Math.random() * (670-30) + 30);
		Element.y = -50;
		createjs.Tween.get(Element)
		.to({y:600}, dropSpeed)
		.call(()=>{
			exportRoot.removeChild(Element);
		})
		.addEventListener("change",()=>{
			let isHit = ndgmr.checkRectCollision(Element, Mario);
			if(isHit) {
				createjs.Tween.removeTweens(Element); //移除金幣動畫
				exportRoot.removeChild(Element); // remove Element Object
				if(addTag){
					score ++;
					let sound = createjs.Sound.play("coin");
					sound.volume = 0.002;
					document.querySelector(".score").innerHTML = score;
				}else{
					Hp -= ATTACK;
					let sound = createjs.Sound.play("hit");
					sound.volume = 0.05;
					document.querySelector(".hp").style.width = `${Hp}%`;
				}
			}
		})
	}

	/*
	async function sleep(ms = 0) {
		return new Promise(r => setTimeout(r, ms));
		}
		 
	async function run() {
		console.log("Before: " + (new Date()).toString());
		await sleep(3000);
		console.log("After: " + (new Date()).toString());
	}
	*/

	// Start Party
	function party(number){
		if(number === 0) return 0;
		setTimeout(()=>{
			let Element = new lib.Coin();
			Element.x = Math.floor(Math.random() * (670-30) + 30);
			Element.y = -50;
			exportRoot.addChildAt(Element, 1);
			createjs.Tween.get(Element)
			.to({y:600}, dropSpeed)
			.call(()=>{
				exportRoot.removeChild(Element);
			})
			.addEventListener("change",()=>{
				let isHit = ndgmr.checkRectCollision(Element, Mario);
				if(isHit) {
					createjs.Tween.removeTweens(Element); //移除金幣動畫
					exportRoot.removeChild(Element); // remove Element Object
					score ++;
					let sound = createjs.Sound.play("coin");
					sound.volume = 0.002;
					document.querySelector(".score").innerHTML = score;
				}
			})
			party(number-1);
		},dropSpeed*0.01);
	}

	// 右 39
	// 左 37
	// 上 38
	// 空白 32
	// 遊戲開始
	document.querySelector(".gamePlayBtn").addEventListener("click", ()=>{
		BgSound = createjs.Sound.play("bg", {loop:-1});
		BgSound.volume = 0.015;
		isStart = true;
		document.querySelector(".gamePlayBtn").style.display = "none";
		window.addEventListener("keydown",keydownMoveFn)
		window.addEventListener("keyup",keyupMoveFn)
	})
	// restart
	document.querySelector(".resetPlay").addEventListener("click", ()=>{
		window.location.reload();
	})

	// left run
	var leftBtn =  document.querySelector(".leftBtn")
	leftBtn.addEventListener("touchstart", (e)=>{
		e.preventDefault();
		keydownMoveFn({keyCode:37});
	})
	
	leftBtn.addEventListener("touchend", ()=>{
		if(Hp > 0) keyupMoveFn({keyCode:37});
	})
	// right run
	var rightBtn = document.querySelector(".rightBtn")
	rightBtn.addEventListener("touchstart", (e)=>{
		e.preventDefault();
		keydownMoveFn({keyCode:39});
	})
	rightBtn.addEventListener("touchend", ()=>{
		if(Hp > 0) keyupMoveFn({keyCode:39});
	})
	

	function keydownMoveFn(e){
		if(isKeydown) return;
		if(e.keyCode === 37 || e.keyCode === 39){
			isKeydown = true;
			position = (e.keyCode === 39) ? 1 : -1;
			Mario.gotoAndPlay("run");
    	}
	}
	function keyupMoveFn(e){
		if(!isKeydown) return;
		isKeydown = false;
		Mario.gotoAndPlay("stop");
	}
	function upLevel(){
		// level up
		if((levelCount+1)>9) return;
		levelCount++;
		console.log(levelCount);
		document.querySelector(".lv").innerHTML = (level[levelCount]).lv;
		difficulty = (level[levelCount]).difficulty; 	
		party((levelCount) * 50);
		showLevel.innerHTML ="<u>Level " + (level[levelCount]).lv +"</u>";
		showLevel.classList.add("closeShowLevel");
		setTimeout(()=>{
			showLevel.classList.remove("closeShowLevel");
		}, 2000)
	}
	function dropHeart(){
		HeartDropped = true;
		dropScore += getHeart;
		// Heart	
		let Heart = new lib.Heart();
		Heart.x = Math.floor(Math.random() * (670-30) + 30);
		Heart.y = -50;
		exportRoot.addChildAt(Heart, 2);
		createjs.Tween.get(Heart)
		.to({y:600}, dropSpeed*2.2)
		.call(()=>{
			Heart.removeChild(Heart);
		})
		.addEventListener("change",()=>{
			let getHeart = ndgmr.checkRectCollision(Heart, Mario);
			if(getHeart) {
				createjs.Tween.removeTweens(Heart); //移除金幣動畫
				exportRoot.removeChild(Heart); // remove Element Object
				Hp = (Hp+ATTACK > 100)? 100 : Hp+ATTACK;
				let sound = createjs.Sound.play("addHp");
				sound.volume = 0.025;
				document.querySelector(".hp").style.width = `${Hp}%`;
			}
		})	
		HeartDropped = false;
	}
	// Ticker
	createjs.Ticker.addEventListener("tick", tickFn)
	function tickFn(){
		// level up
		if(score >= (level[levelCount]).score) upLevel();
		// GetHeart add Hp And Level Up 
		if(!HeartDropped && score>=dropScore) dropHeart();
		// Mario dead
		if(Hp <= 0){
			clearInterval(timeElement);
			BgSound.stop();
			let sound = createjs.Sound.play("over");
			sound.volume = 0.04;
			document.querySelector(".over").style.display = "flex";
			leftBtn.parentElement.removeChild(leftBtn);
			rightBtn.parentElement.removeChild(rightBtn);
			window.removeEventListener("keydown",keydownMoveFn)
			window.removeEventListener("keyup",keyupMoveFn)
			createjs.Ticker.removeEventListener("tick", tickFn);
			Mario.gotoAndPlay("dead");
		}
		// Mario run
		if(!isKeydown) return;
		Mario.scaleX = position; 
		Mario.x += SPEED * position;	
		if(Mario.x < 10) return Mario.x += SPEED; 
		if(Mario.x > 690) return Mario.x -= SPEED;
		if(isJump){
		}
	}

	//Registers the "tick" event listener.
	fnStartAnimation = function() {
		stage.addChild(exportRoot);
		createjs.Ticker.setFPS(lib.properties.fps);
		createjs.Ticker.addEventListener("tick", stage);
	}	    
	//Code to support hidpi screens and responsive scaling.
	AdobeAn.makeResponsive(false,'both',false,1,[canvas,anim_container,dom_overlay_container]);	
	AdobeAn.compositionLoaded(lib.properties.id);
	fnStartAnimation();
}
