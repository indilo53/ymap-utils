const EventEmitter  = require('events');
const DOMParser     = require('xmldom').DOMParser;
const XMLSerializer = require('xmldom').XMLSerializer;
const xpath         = require('xpath').useNamespaces();
const THREE         = require('three');
const {YMAP}        = require('./ymap.js');

const serializer = new XMLSerializer();

function createNode(doc, name, children) {

	const node = doc.createElement(name);

	for(let k in children) {
		if(children.hasOwnProperty(k)) {

			const child = doc.createElement(k);

			for(let k1 in children[k]) {

				switch(k1) {

					case '__text' : {
						child.textContent = children[k][k1];
						break;
					}

					default : {
						child.setAttribute(k1, children[k][k1]);
						break;
					}

				}

			}

			node.appendChild(child);

		}
	}

	return node;

}

// https://stackoverflow.com/questions/42812861/three-js-pivot-point
function rotateAboutPoint(obj, point, axis, theta, pointIsWorld){
	
	var pointIsWorld = (pointIsWorld === undefined) ? false : pointIsWorld;
  
	if(pointIsWorld)
		obj.parent.localToWorld(obj.position); // compensate for world coordinate
  
	obj.position.sub(point); // remove the offset
	obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
	obj.position.add(point); // re-add the offset
  
	if(pointIsWorld)
		obj.parent.worldToLocal(obj.position); // undo world coordinates compensation
  
	obj.rotateOnAxis(axis, theta); // rotate the OBJECT

}


module.exports = {
	YTYP      : YTYP,
	Vector3   : THREE.Vector3,
	Quaternion: THREE.Quaternion,
};