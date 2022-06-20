var app = module.exports = require('appjs');
var fs	= require('fs');
var ini	= require('ini');
var path = require('path');
var regedit = require('regedit');

app.serveFilesFrom(__dirname + '/root');

function readconf() {
	return ini.parse(fs.readFileSync(__dirname + '/../config.ini','utf-8'))
}

config = readconf();
config.paths = config.paths.split('|')
_gamedir = config.gamedir

if (!fs.existsSync(config.gamedir) || !config.hasOwnProperty("gamedir"))
{
	chartclasskey = 'HKCR\\FastGH3.chart\\shell\\open\\command'
	_gamedir = "C:\\Program Files (x86)\\FastGH3\\"
	regedit.list(chartclasskey,
		function(err, result) {
			chartclass = result[chartclasskey]
			config.gamedir = _gamedir
			if (chartclass.hasOwnProperty('values'))
			{
				cmd = chartclass.values[''].value
				// assume default args "file" "%1"
				_gamedir = chartclass.values[''].value.substr(1,cmd.indexOf('FastGH3.exe')-1)
				config.gamedir = _gamedir
			}
		})
	// guess default location, if registry value not found
}

// cheap parse using quotes to find the end
function findKeyValue(chartstr,key) {
	keyplace = chartstr.indexOf(key)
	if (keyplace === -1) return null;
	start = chartstr.indexOf("\"",keyplace)
	if (start === -1) return null;
	end = chartstr.indexOf("\"",start+1)
	if (end === -1) return null;
	return chartstr.substr(start+1,end-start-1)
}

function readChartDir(dir) {
	var list = [];
	var iterate = 0;
	fs.readdirSync(dir).forEach(
		function(f) {
			if (f.substr(-6) === ".chart" || f.substr(-4) === ".mid")
			{
				if (fs.lstatSync(path.join(dir,f)).isFile())
				{
					file = path.join(dir,f)
					chart = fs.readFileSync(file,'utf-8')
					var chartentry;
					if (f.substr(-6) === ".chart")
						chartentry = {
							lastmod: fs.lstatSync(file).mtime,
							file: file,
							title: findKeyValue(chart,"Name"),
							artist: findKeyValue(chart,"Artist"),
							album: null,
							genre: findKeyValue(chart,"Genre"),
							year: null,
							duration: null,
							charter: findKeyValue(chart,"Charter"),
							streams: [findKeyValue(chart,"MusicStream"),
									findKeyValue(chart,"GuitarStream"),
									findKeyValue(chart,"BassStream")]
						};
					else
						chartentry = {
							lastmod: fs.lstatSync(file).mtime,
							file: file,
							title: "Untitled",
							artist: "Unknown",
							album: null,
							genre: "Unknown",
							year: null,
							duration: null,
							charter: "Unknown",
							streams: [null,
									null,
									null]
						};
					
					//chartentry.inif = path.join(dir,'song.ini')
					if (fs.existsSync(path.join(dir,'song.ini')))
					{
						// CasE sEnsITiVe!!!!111
						var songini = ini.parse(fs.readFileSync(path.join(dir,'song.ini'),'utf-8'));
						var doesthisevenexist = false;
						var CaSEs = ["song","Song","SONG"];
						//                           ^
						//     use if you have down syndrome
						//wait but then this can be the case for the keys below
						var songsect;
						for(var i=0;i<CaSEs.length;i++)
						{
							songsect = CaSEs[i]
							if (songini.hasOwnProperty(songsect))
							{
								doesthisevenexist = true
								break
							}
						}
						//console.log(songini[songsect])
						//chartentry.ini = songini
						if (doesthisevenexist)
							try {
								// ?!?!?!?!?!
								if (songini[songsect].name !== undefined)
									chartentry.title = songini[songsect].name;
								if (songini[songsect].artist !== undefined)
									chartentry.artist = songini[songsect].artist;
								if (songini[songsect].album !== undefined)
									chartentry.album = songini[songsect].album;
								if (songini[songsect].genre !== undefined)
									chartentry.genre = songini[songsect].genre;
								if (songini[songsect].year !== undefined)
									chartentry.year = songini[songsect].year;
								if (songini[songsect].charter !== undefined)
									chartentry.charter = songini[songsect].charter;
								if (songini[songsect].song_length !== undefined)
									chartentry.duration = parseInt(songini[songsect].song_length)/1000;
							} catch (e) {
								console.log("moron");
								console.log(dir);
								console.log(e);
							}
					}
					if (chartentry.title === null || chartentry.title === undefined)
						chartentry.title = "Untitled";
					if (chartentry.artist === null || chartentry.artist === undefined)
						chartentry.artist = "Unknown";
					if (chartentry.album === null || chartentry.album === undefined)
						chartentry.album = "Unknown";
					if (chartentry.genre === null || chartentry.genre === undefined)
						chartentry.genre = "Unknown";
					if (chartentry.charter === null || chartentry.charter === undefined)
						chartentry.charter = "Unknown";
					
					// weird
					// JUST COPY THE CODE FROM THE LAUNCHER YOU B-
					var foundstr = false;
					if (chartentry.streams[0] === null || !fs.existsSync(chartentry.streams[0]))
					{
						chartentry.streams[0] = null;
						["mp3","ogg","wav"].forEach(function(ext) {
							if (fs.existsSync(path.join(dir,path.basename(file, path.extname(file))+"."+ext)))
							{
								chartentry.streams[0] = path.join(dir,path.basename(file, path.extname(file))+"."+ext)
								foundstr = true;
							}
						});
					}
					if (!foundstr)
					{
						var streamnames = ["song","guitar","rhythm"];
						for (var i = 0; i < 3; i++)
						{
							if (chartentry.streams[i] !== null && fs.existsSync(chartentry.streams[i]))
								chartentry.streams[i] = path.join(dir,chartentry.streams[i])
							else
							{
								chartentry.streams[i] = null;
								["mp3","ogg","wav"].forEach(function(ext) {
									if (fs.existsSync(path.join(dir,streamnames[i]+"."+ext)))
										chartentry.streams[i] = path.join(dir,streamnames[i]+"."+ext)
								});
							}
						}
					}
					if (!foundstr)
					{
						var streamnames = ["song","lead","bass"];
						for (var i = 1; i < 3; i++)
						{
							if (chartentry.streams[i] === null && !fs.existsSync(chartentry.streams[i]))
							{
								chartentry.streams[i] = null;
								["mp3","ogg","wav"].forEach(function(ext) {
									if (fs.existsSync(path.join(dir,streamnames[i]+"."+ext)))
										chartentry.streams[i] = path.join(dir,streamnames[i]+"."+ext)
								});
							}
						}
					}
					// and what for...
					list.push(chartentry)
				}
			}
			if (f !== ".git") // stupid me hosting charts on github
			if (fs.lstatSync(path.join(dir,f)).isDirectory())
			{
				list.push.apply(list, readChartDir(path.join(dir,f))); // >:D
			}
		});
	return list;
}

app.router.get('/config', function(request, response, next){
	config = readconf();
	config.paths = config.paths.split('|')
	config.gamedir = _gamedir
	//console.log(_gamedir)
	response.send(JSON.stringify(config))
})

app.router.get('/charts', function(request, response, next){
	response.send(JSON.stringify(readChartDir(request.params['path'])))
})

app.router.get('/exit', function(request, response, next){
	process.exit()
})

app.router.get('/curver', function(request, response, next){
	if (!fs.existsSync(config.gamedir))
	{
		window.alert("Game directory could not be found");
		process.exit();
	}
	if (fs.existsSync(path.join(config.gamedir, '/DATA/MUSIC/TOOLS/v.bin')))
		response.send(fs.readFileSync(path.join(config.gamedir, '/DATA/MUSIC/TOOLS/v.bin'),'utf-8'))
	else
		response.send("null")
})

var window = app.createWindow({
	width	: 1200,
	height	: 810,
	icons	: __dirname + '/root/icons'
});

window.on('create', function(){
	window.frame.show().center();
});

var isFullscr = false;

window.on('ready', function(){
	window.process = process;
	window.module = module;
	if (!fs.existsSync(config.gamedir))
	{
		window.alert("Game directory could not be found");
		process.exit();
	}
	window.frame.opacity = 0.9;
	window.addEventListener('keydown', function(e){
		if (e.keyIdentifier === 'F12') {
			window.frame.openDevTools();
		}
		if (e.keyIdentifier === 'F11') {
			isFullscr = !isFullscr;
			if (isFullscr)
				window.frame.fullscreen();
			else
			{
				window.frame.restore()
				window.frame.resizable = true;
			}
		}
	});
});

window.on('close', function(){
	
});
