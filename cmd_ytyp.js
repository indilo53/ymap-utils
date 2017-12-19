#!/usr/bin/env node

const fs                                = require('fs');
const {YMAP, YTYP, Vector3, Quaternion} = require('./ymap.js');
const program                           = require('commander');

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
  .description('YTYP toolkit')
  .option('-gp,  --genprops',              'Generate props definitions')
  .option('-yt,  --ytyp      [file]',      'YTYP file')
  .option('-d    --directory [directory]', 'Directory')
;

program.on('--help', function() {
	
	console.log('');
	console.log('  Examples:');
	console.log('    ytyp --genprops --dir ./props/stream');
	console.log('    ytyp --genprops --ytyp props_def.ytyp.xml');
	console.log('');

})

program.parse(process.argv)

if(program.genprops) {

	if(typeof program.directory == 'undefined' && typeof program.ytyp == 'undefined') {
		console.error('--directory or --ytyp or both required');
		return;
	}

	if(typeof program.ytyp != 'undefined' && !fs.existsSync(program.ytyp)) {
		console.error('File ' + program.ytyp + ' not found');
		return;
	}

	const genYtyp = new YTYP(fs.readFileSync(__dirname + '/data/props.ytyp.xml', 'utf8'));

	if(typeof program.directory != 'undefined') {

		const ydr = 
			fs.readdirSync(program.directory)
			.filter(e => {
				const buff = e.split('.');
				return buff[buff.length - 1] == 'ydr';
			})
			.map(e => {
				const buff = e.split('.');
				buff.pop()
				return buff.join('.')
			})
		;

		for(let i=0; i<ydr.length; i++) {
			console.log(ydr[i])
			genYtyp.addEntityDef(ydr[i])
		}

	}

	if(typeof program.ytyp != 'undefined'){

		const ytyp = new YTYP(fs.readFileSync(program.ytyp, 'utf8'));

		for(let i=0; i<ytyp.entityDefs.length; i++) {
			console.log(ytyp.entityDefs[i].getElementsByTagName('name')[0].textContent);
			genYtyp.addEntityDef(ytyp.entityDefs[i]);
		}

	}

	fs.writeFileSync('props.ytyp.xml', genYtyp.build());

} 