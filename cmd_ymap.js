#!/usr/bin/env node

const fs                                = require('fs');
const {YMAP, YTYP, Vector3, Quaternion} = require('./ymap.js');
const program                           = require('commander');
const byline                            = require('byline');

const pkg = JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf8'));

const getDistanceBetweenCoords = function(coords1, coords2){
	return Math.sqrt(
		(coords2.x - coords1.x) * (coords2.x - coords1.x) +
		(coords2.y - coords1.y) * (coords2.y - coords1.y) +
		(coords2.z - coords1.z) * (coords2.z - coords1.z)
	)
}

// Program
function parsePosition(val) {
	
	const buff = val.split(',').map(e => parseFloat(e));

	if(
		typeof buff[0] != 'undefined' &&
		typeof buff[1] != 'undefined' &&
		typeof buff[2] != 'undefined'
	) {
		return new Vector3(buff[0], buff[1], buff[2]);
	}
}

function parseRotation(val) {

	const buff = val.split(',').map(e => parseFloat(e));

	if(
		typeof buff[0] != 'undefined' &&
		typeof buff[1] != 'undefined' &&
		typeof buff[2] != 'undefined' &&
		typeof buff[3] != 'undefined'
	) {
		return new Quaternion(buff[0], buff[1], buff[2], buff[3]);
	}

}

program
	.version(pkg.version)
  .description('YMAP toolkit')
  .option('-i,   --inject2ytp',            'Inject YMAP to YTYP')
  .option('-f,   --find',                  'Find YMAP')
  .option('-yt,  --ytyp      [file]',      'YTYP file')
  .option('-ym,  --ymap      [file]',      'YMAP file')
  .option('-r,   --room      [name]',      'Room name')
  .option('-pos, --position  <pos>',       'Initial position => x,y,z',   parsePosition)
  .option('-rot, --rotation  <rot>',       'Initial rotation => x,y,z,w', parseRotation)
  .option('-n,   --name      [name]',      'Output file name without extension')
  .option('-r,   --radius    [radius]',    'Radius')
;

program.on('--help', function() {
	console.log('');
	console.log('  Examples:');
	console.log('');
	console.log('    ymap --find --position 1009.54500000,-3196.59700000,-39.99353000 --radius 25');
	console.log('    ymap --inject2ytp --ytyp bkr_biker_dlc_int_ware01.ytyp.xml --ymap weed2.ymap.xml --room MethMain --position 1009.54500000,-3196.59700000,-39.99353000 --rotation 0.0,0.0,0.0,1.0 --name merged');
	console.log('');
})

program.parse(process.argv)

if(program.inject2ytp) {

	if(
		typeof program.ytyp     != 'undefined' &&
		typeof program.ymap     != 'undefined' &&
		typeof program.position != 'undefined' &&
		typeof program.rotation != 'undefined' &&
		typeof program.name     != 'undefined'
	) {

		if(typeof program.room == 'undefined')
			program.room = null;

		if(!fs.existsSync(program.ytyp)) {
			console.error('File ' + program.ytyp + ' not found');
			return;
		}

		if(!fs.existsSync(program.ymap)) {
			console.error('File ' + program.ymap + ' not found');
			return;
		}

		const ytyp = new YTYP(fs.readFileSync(program.ytyp, 'utf8'));
		const ymap = new YMAP(fs.readFileSync(program.ymap, 'utf8'));

		ytyp.on('entity.merge', function(i, max) {
			console.error('Merge => ' + i + '/' + max)
		})

		ytyp.merge(ymap, program.room, program.position, program.rotation);
		
		fs.writeFileSync(program.name + '.ytyp.xml', ytyp.build());

	}

} else if(program.find) {

	if(typeof program.position == 'undefined') {
		console.error('--position required');
		return;
	}

	if(typeof program.radius == 'undefined') {
		program.radius = 25;
	}

	const stream = byline(fs.createReadStream(__dirname + '/data/ymap_coords.txt', {encoding: 'utf8'}));

	stream.on('data', function(line) {

		const buff  = line.split('|')
		const buff2 = buff[0] .split(',')
		
		if(typeof buff[1] != 'undefined'){

			const buff3    = buff[1] .split(',')
			const name     = buff2[0];
			const entity   = buff2[1];
			const coords   = {x: parseFloat(buff3[0]), y: parseFloat(buff3[1]), z: parseFloat(buff3[2])};
			const distance = getDistanceBetweenCoords(program.position, coords);

			if(distance <= program.radius)
				console.log(name);

		}

	});

} 