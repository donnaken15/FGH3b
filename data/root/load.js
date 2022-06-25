
loaded = false
function setloadstat(t,p) {
	document.getElementById("loadText").innerHTML = "Loading... ("+Math.floor(p*100).toString()+"%)<br>"+t
};

var setlist = [
];

var numofops = 4;
setloadstat("",0/numofops);
// cram this so it looks like
// its loading that too instead
// of just from the HTML lol

// basically look fancy

// doesn't even appear unless
// refreshing a bunch
// or setting timeouts (like i just did)

// also refreshing a bunch too fast
// crashes it for some reason
setTimeout(function() {
	setloadstat("Functions",1/numofops);
	DL = function(method, url, done) {
		var xhr = new XMLHttpRequest();
		xhr.open(method, url);
		xhr.onload = function () {
			done(null, xhr.response);
		};
		xhr.onerror = function () {
			done(xhr.response);
		};
		xhr.send();
	};
	launcher_fail = false
	launcher_active = false
	run = function(a) {
		launcher_active = true
		FASTsearchDisable = true
		document.getElementById("launchr-panel").style.visibility = "visible"
		launchr_text = document.getElementById("launchr-text")
		launchr_text.value = ""
		
		launcher = exec('"'+config.gamedir+'\\FastGH3.exe" '+'"'+setlist[a].file+'"')
		didsomethingwrongmaybe = setTimeout(function() {
			document.getElementById("launchr-okbtn").style.visibility = "visible"
		}, 10000)
		
		launcher.stdout.on('data', function (data) {
			launchr_text.value += data.toString()
			launchr_text.scrollTop = launchr_text.scrollHeight
			//console.log('stdout: ' + data.toString());
			// CRASHES BROWSER ON A SPECIFIC SONG
		});

		launcher.stderr.on('data', function (data) {
			clearTimeout(didsomethingwrongmaybe)
			launchr_text.value += data.toString()
			launchr_text.scrollTop = launchr_text.scrollHeight
			launcher_fail = true
			document.getElementById("launchr-okbtn").style.visibility = "visible"
			FASTsearchDisable = true
			//console.log('stderr: ' + data.toString());
		});

		launcher.on('exit', function (code) {
			if (!launcher_fail)
			{
				clearTimeout(didsomethingwrongmaybe)
				setTimeout(function() {
					document.getElementById("launchr-panel").style.visibility = "hidden"
					document.getElementById("launchr-okbtn").style.visibility = "hidden"
					launcher_active = false
					FASTsearchDisable = false
				}, 1000)
			}
			//console.log('child process exited with code ' + code.toString());
		});
	}
	sortByProperty = "file"
	sortSetlist = function() {
		setlist = __setlist.sort(function(a,b){
			return 1-((a[sortByProperty]<b[sortByProperty])<<1);
		});
		chartcycle()
	}
	String.prototype.lpad = function(padString, length) {
		var str = this;
		while (str.length < length)
			str = padString + str;
		return str;
	} // by diEcho
	updateMetaSide = function(i) {
		var chrt = setlist[i];
		if (chrt.duration !== null)
			document.getElementById("cd-len").innerText = ((chrt.duration/60).toFixed()+":"+(chrt.duration%60).toFixed().lpad("0",2))
		else
			document.getElementById("cd-len").innerText = "Unknown"
		document.getElementById("cd-album").innerText = chrt.album
		document.getElementById("cd-year").innerText = chrt.year
		document.getElementById("cd-genre").innerText = chrt.genre
		document.getElementById("cd-athr").innerText = chrt.charter
		document.getElementById("cd-cvr")
	}
	chartrows = 0;
	keyholdint = 0;
	FASTsearchStr = "";
	chartselectold = null;
	FASTsearchTimeout = null;
	FASTsearchDisable = false;
	FASTsearchActive = false;
	ctrlMod = false;
	document.onkeyup = function (e) {
		if (e.keyCode === 17)
			ctrlMod = false;
	}
	document.onkeydown = function (e) {
		if (e.keyCode === 17)
			ctrlMod = true;
		if (launcher_active) return;
		if (e.keyCode === 33 || e.keyCode === 34 ||
			e.keyCode === 40 || e.keyCode === 38)
		{
			if (e.keyCode === 34)
				chartselect += chartrows
			if (e.keyCode === 33)
				chartselect -= chartrows
			if (e.keyCode === 40)
				chartselect++
			if (e.keyCode === 38)
				chartselect--
			if (chartselect < 0)
				chartselect = setlist.length + chartselect
			if (chartselect >= setlist.length)
				chartselect = chartselect % setlist.length
			chartwheel = chartselect-(chartrows>>1)
			chartcycle()
			updateMetaSide(chartselect)
			return;
		}
		if (e.keyCode === 13 && chartselect !== null)
		{
			run(chartselect)
			return;
		}
		if (((e.keyCode >= 65 && e.keyCode <= 90) ||
			(e.keyCode >= 48 && e.keyCode <= 57) ||
			e.keyCode === 32) && !FASTsearchDisable
			&& !ctrlMod)
		{
			var fsrch_inp = document.getElementById("fsrch-inp");
			FASTsearchStr += String.fromCharCode(e.keyCode)
			fsrch_inp.innerText = "SEARCH: " + FASTsearchStr
			fsrch_inp.innerHTML += "&nbsp;"
			fsrch_inp.parentNode.style.visibility = "visible"
			
			var index = chartselect;
			if (index === null)
				index = chartwheel;
			var prop = "title";
			if(!FASTsearchActive)
				index++
			index %= setlist.length;
			for(var i=0;i<setlist.length;i++) {
				//console.log(setlist[index])
				if (setlist[index].hasOwnProperty(prop))
					if (setlist[index][prop].toUpperCase().substr(0,FASTsearchStr.length) == FASTsearchStr)
					{
						//console.log("found")
						chartselect = index
						chartwheel = chartselect-(chartrows>>1)
						chartcycle()
						updateMetaSide(chartselect)
						break;
					}
				index++;
				index %= setlist.length;
			}
			if (FASTsearchActive)
				clearTimeout(FASTsearchTimeout)
			FASTsearchTimeout = setTimeout(function(){
				//console.log("Fast search cancelled")
				//console.log(FASTsearchStr)
				FASTsearchStr = ""
				FASTsearchActive = false
				fsrch_inp.parentNode.style.visibility = "hidden"
			},700)
			FASTsearchActive = true
			return;
		}
		console.log("WHAT ARE YOU PRESSING?!?!")
		console.log(e)
	}
	
	cacheDetect = true
	
	charttable = document.getElementById("chart-cycler").children[0]
	cyclehead = charttable.children[0].cloneNode(true)
	charttemplate = document.getElementById("chart-entry").cloneNode(true)
	charttemplate.id = null
	
	dblclickcheck = false;
	chartselect = null;
	chartwheel = 0;
	chartcycle = function() {
		if (launcher_active) return;
		var rowHeight = 45;                  // stupid
		var listHeight = document.getElementById("cc-more").offsetHeight - 38;//(innerHeight-135); /*(rowHeight*3) ..?? */
		// I want to figure out how to scale it beyond or below just using archivo narrow 28px
		if (chartwheel < 0)
			chartwheel = setlist.length + chartwheel
		if (chartwheel >= setlist.length)
			chartwheel = chartwheel % setlist.length
		charttable.innerHTML = cyclehead.outerHTML
		
		var chartentry;
		var index = 0;
		var i = 0;
		for (i = 0; i < Math.floor(listHeight/rowHeight); i++)
		{
			index = (chartwheel+i)%setlist.length
			chartentry = charttemplate.cloneNode(true);
			// CAN LEAD TO ACE, OOPS
			// BUT WUT BOUT MUH COLORED SONG.INI TEXT
			chartentry.id = index
			chartentry.children[0].children[0].innerText = setlist[index].title
			chartentry.children[2].children[0].innerText = setlist[index].artist
			if (chartselect === index)
				chartentry.classList.add("chart-select")
			if (setlist[index].cache !== null)
				chartentry.classList.add("cached")
			chartentry.onclick = function(e) {
				if(dblclickcheck && chartselect == parseInt(this.id))
				{
					run(parseInt(this.id))
				}
				dblclickcheck = true
				setTimeout(function(){dblclickcheck=false},300)
				
				updateMetaSide(this.id)
				chartselect = parseInt(this.id)
				chartcycle() // ugh
			}
			charttable.appendChild(chartentry)
		}
		chartrows = i;
	};
	document.getElementById("chart-cycler").onmousewheel =
		function(a) {
			chartwheel -= a.wheelDeltaY / 120; // each time, delta is = 120 for me
			chartcycle()
		}
	
	setTimeout(function() {
		setloadstat("Style resources",2/numofops);
		document.head.innerHTML +=
			'<link rel="stylesheet" href="style.css">'+
			'<link rel="stylesheet" href="custom.css">'+
			'<link rel="preconnect" href="https://fonts.googleapis.com">'+
			'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'+
			'<link href="https://fonts.googleapis.com/css2?family=Archivo+Narrow:ital@0;1&family=Roboto+Mono:ital@0;1&display=swap" rel="stylesheet">'
		
		// can't do synchronous XHR, hangs program >:(
		// have to do complicated promise stuff
		setTimeout(function() {
			DL('GET', 'config', function (err, data) {
				if (err) {
					setloadstat('<span style="color:#f00">ERROR:<br>'+err+"</span>",0)
					throw err;
				}
				config = JSON.parse(data)
				numofops += config.paths.length;
				setloadstat("Checking for updates",3/numofops)
				DL('GET', 'https://donnaken15.tk/fastgh3/vl.json', function (err, vl) {
					if (err) {
						console.log(err); // doesn't matter huh
						return;
					}
					else
					{
						vl = JSON.parse(vl)
						DL('GET', 'https://donnaken15.tk/fastgh3/v', function (err, latest) {
							if (err) {
								console.log(err);
								return;
							}
							else
							{
								DL('GET', 'curver', function (err, current) {
									if (err) {
										console.log(err);
										return;
									}
									var version_latest = parseInt(atob(latest));
									var version_current = parseInt(atob(current))
									var buildno = document.getElementById("buildno")
									if (current === "null")
									{
										buildno.innerHTML = ""
									}
									else
									{
										if (vl.hasOwnProperty(version_current))
										{
											buildno.innerHTML = vl[version_current]
											if (version_latest > version_current)
											{
												buildno.innerHTML = "<span style=\"color:#ff9326;opacity:1\">NEW UPDATE!1!!</span>"
											}
										}
										else
										{
											buildno.style.color = "#a00"
											buildno.innerHTML = "HAX!!"
										}
									}
								});
							}
						});
					}
				});
				setTimeout(function() {
					if (config.paths.length === 1 && config.paths[0] === "")
					{
						alert("No song directories can be found. Add one or more in the config.ini. Paths are separated by the vertical bar: |");
						window.close();
					}
					else
						config.paths.forEach(function(dir,i){
							setTimeout(function() {
								setloadstat("Charts",(4+i)/numofops)
								DL('GET', 'charts?path='+dir, function (err, data) {
									if (err) {
										console.log(err);
										return;
									}
									console.log("loaded "+dir)
									setlist.push.apply(setlist, JSON.parse(data));
									if (i >= config.paths.length-1 && loaded !== true)
									{
										setloadstat("Done!",1)
										__setlist = setlist; // make a copy in case of sorting, whatever would happen with that
										document.getElementById("ccount").innerHTML = setlist.length
										chartwheel = Math.floor(Math.random()*(setlist.length-1))
										window.addEventListener('keydown', function(e){
											if (e.keyIdentifier === 'F1') {
												window.location.href = window.location.href
											}
										});
										setTimeout(function() {
											resizeEvent = function(e) {
												document.getElementById("cc-sep").style.height = (innerHeight-107).toString()+"px"
												document.getElementById("cc-more").style.height = document.getElementById("cc-sep").style.height
												chartcycle()
											};
											resizeEvent()
											document.getElementById("load").outerHTML = ""
											setTimeout(function() {
												exec = require('child_process').exec
												var fs	= require('fs')
												var ini	= require('ini')
												if (!fs.existsSync(config.gamedir + '/DATA/CACHE/.db.ini'))
													cacheDetect = false
												if (cacheDetect)
												{
													var timeToFlt = function(val) {
														var dgt = val.split(":")
														return (+dgt[0] * 60) + (+dgt[1]) // from string to int to string :|
													}
													var path = require('path')
													wzk64cmd = "\""+path.join(path.dirname(process.execPath),"WZK64.exe")+"\""
													var cachedini = ini.parse(fs.readFileSync(config.gamedir + '/DATA/CACHE/.db.ini','utf-8'))
													setlist.forEach(function(e,i){
														setTimeout(function() {
															exec(wzk64cmd+" \""+e.file+"\"")
																.stdout.on("data",function(data) {
																	var id = data.substr(0,16)
																	var centry = cachedini[id]
																	if (centry)
																	{
																		e.cache = id
																		if (e.title === "Untitled") // fallback to ini cache for whatever reason
																		{
																			e.title = centry.Title
																			//console.log(e.title)
																		}
																		if (e.artist === "Unknown")
																		{
																			e.artist = centry.Author
																			//console.log(e.artist)
																		}
																		if (e.duration === null)
																		{
																			e.duration = timeToFlt(centry.Length)
																			//console.log(e.duration)
																		}
																		//console.log(centry)
																		chartcycle() // just to show cached icon
																	}
																}) // weird
															// lazy to do it in js but i feel like it would also mess up and output differently anyway
														}, 25*i); // don't halt the program during this just to not disrupt user
													})
												}
											}, 1000);
										}, 40);
										loaded = true
									}
								});
							}, 10);
						})
				}, 10);
			});
		}, 10);
	}, 10);
}, 20);
