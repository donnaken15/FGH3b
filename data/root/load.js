
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
	run = function(a) {
		launcher = exec('"'+config.gamedir+'\\FastGH3.exe" '+'"'+setlist[a].file+'"')
		
		launcher.stdout.on('data', function (data) {
			//console.log('stdout: ' + data.toString());
			// CRASHES BROWSER ON A SPECIFIC SONG
		});

		launcher.stderr.on('data', function (data) {
			//console.log('stderr: ' + data.toString());
		});

		launcher.on('exit', function (code) {
			//console.log('child process exited with code ' + code.toString());
		});
	}
	
	charttable = document.getElementById("chart-cycler").children[0]
	cyclehead = charttable.children[0].cloneNode(true)
	charttemplate = document.getElementById("chart-entry").cloneNode(true)
	charttemplate.id = null
	
	dblclickcheck = false;
	chartselect = null;
	chartwheel = 0;
	chartcycle = function() {
		var rowHeight = 45;
		var listHeight = (innerHeight-135);
		if (chartwheel < 0)
			chartwheel = setlist.length + chartwheel
		if (chartwheel >= setlist.length)
			chartwheel = chartwheel % setlist.length
		charttable.innerHTML = cyclehead.outerHTML
		
		var chartentry;
		var index = 0;
		for (var i = 0; i < Math.floor(listHeight/rowHeight); i++)
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
			chartentry.onclick = function(e) {
				if(dblclickcheck && chartselect == parseInt(this.id))
				{
					run(parseInt(this.id))
				}
				dblclickcheck = true
				setTimeout(function(){dblclickcheck=false},300)
				
				chartselect = parseInt(this.id)
				chartcycle() // ugh
			}
			charttable.appendChild(chartentry)
		}
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
										document.getElementById("ccount").innerHTML = setlist.length
										chartwheel = Math.floor(Math.random()*(setlist.length-1))
										setTimeout(
											function() {
												resizeEvent = function(e) {
													document.getElementById("cc-sep").style.height = (innerHeight-107).toString()+"px"
													document.getElementById("cc-more").style.height = document.getElementById("cc-sep").style.height
													chartcycle()
												};
												resizeEvent()
												document.getElementById("load").outerHTML = ""
												setTimeout(
													function() {
														exec = require('child_process').exec
													}, 2000);
											}, 20);
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
