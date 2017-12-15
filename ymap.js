const EventEmitter  = require('events');
const DOMParser     = require('xmldom').DOMParser;
const XMLSerializer = require('xmldom').XMLSerializer;
const xpath         = require('xpath').useNamespaces();
const THREE         = require('three');

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

class YMAP extends EventEmitter {

	get entities() {
		return xpath('//CMapData/entities/Item', this.doc);
	}

	constructor(xmlString) {
		super();
		this.parse(xmlString);
	}

	parse(xmlString) {
		this.doc = new DOMParser().parseFromString(xmlString);
	}

	build() {
		return serializer.serializeToString(this.doc);
	}

	merge(target) {

		if(target instanceof YMAP) {

			const entities = target.entities;

			for(let i=0; i<entities.length; i++) {
				this.emit('entity.merge', i, entities.length - 1)
				const newNode = this.addEntity(entities[i]);
			}

		} else if(target instanceof YTYP) {
			// TODO
		}

	}

	addEntity(entity) {
		
		const entities = xpath('//CMapData/entities', this.doc)[0];
		const newNode  = entity.cloneNode(true);

		entities.appendChild(newNode);
	}

	normalizeHashes() {

		const entities       = this.entities;
		const archetypeNames = xpath('//CMapData/entities/Item/archetypeName', this.doc);

		for(let i=0; i<archetypeNames.length; i++) {
			
			this.emit('entity.normalize', i, archetypeNames.length - 1)
			
			if(archetypeNames[i].textContent.substr(0, 2) == '0x')
				archetypeNames[i].textContent = 'hash_' + archetypeNames[i].textContent.substr(2, archetypeNames[i].textContent.length).toUpperCase();

		}

	}

}

class YTYP extends EventEmitter {

	get entityDefs() {
		return xpath('//CMapTypes/archetypes/Item[@type="CBaseArchetypeDef"]', this.doc);
	}

	get entities() {
		return xpath('//CMapTypes/archetypes/Item[@type="CMloArchetypeDef"]/entities/Item', this.doc);
	}

	constructor(xmlString) {
		super();
		this.parse(xmlString);
	}

	parse(xmlString) {
		
		this.doc                 = new DOMParser().parseFromString(xmlString);
		this.entitiesContainer   = xpath('//CMapTypes/archetypes/Item[@type="CMloArchetypeDef"]/entities', this.doc)[0];
		this.roomAttachedObjects = {};
		const rooms              = xpath('//CMapTypes/archetypes/Item[@type="CMloArchetypeDef"]/rooms/Item', this.doc);

		for(let i=0; i<rooms.length; i++) {
			const roomName                     = rooms[i].getElementsByTagName('name')[0].textContent;
			const itemIds                      = rooms[i].getElementsByTagName('attachedObjects')[0].textContent.split(/[\r\n\t\s]{1,}/);
			this.roomAttachedObjects[roomName] = itemIds.filter(e => e != '').map(e => parseInt(e));
		}

	}

	build() {

		for(let roomName in this.roomAttachedObjects) {

			const xpathExpression     = '//CMapTypes/archetypes/Item[@type="CMloArchetypeDef"]/rooms/Item/name[text()="' + roomName + '"]/parent::Item/attachedObjects/text()';
			const roomAttachedObjects = xpath(xpathExpression, this.doc)[0];
			const depth               = xpath(xpathExpression + '/ancestor::*', this.doc).length;
			let spaces                = '';
			let lastSpaces            = '';
			const entities            = this.entities;

			for(let i=0; i<depth; i++) {
				
				spaces = spaces + '  ';
				
				if(i < depth - 1)
					lastSpaces = lastSpaces + '  ';
			}

			roomAttachedObjects.textContent = "\r\n" + spaces + this.roomAttachedObjects[roomName].join("\r\n" + spaces) + "\r\n" + lastSpaces;

		}

		return serializer.serializeToString(this.doc);
	}

	merge(target, roomName, initialPos, initialRot) {

		initialPos = initialPos || new THREE.Vector3(0.0, 0.0, 0.0);
		initialRot = initialRot || new THREE.Quaternion(0.0, 0.0, 0.0, 1.0)

		if(target instanceof YMAP) {

			const entities = target.entities;

			for(let i=0; i<entities.length; i++) {
				
				this.emit('entity.merge', i, entities.length - 1)

				const newNode = this.addEntity(entities[i], initialPos, initialRot);

				if(roomName) {

					this.addEntityToRoom(newNode, roomName);

				} else {

					for(let roomName in this.roomAttachedObjects)
						this.addEntityToRoom(newNode, roomName);
				}
			}

		} else if(target instanceof YTYP) {
			// TODO
		}

	}

	addEntityDef(name) {

		if(typeof name == 'string') {

			const children = {
				lodDist            : {value: '500.0'},
				flags              : {value: 32},
				specialAttribute   : {value: 0},
				bbMin              : {x: '0.0', y: '0.0', z: '0.0'},
				bbMax              : {x: '0.0', y: '0.0', z: '0.0'},
				bsCentre           : {x: '0.0', y: '0.0', z: '0.0'},
				bsRadius           : {value: '0.0'},
				hdTextureDist      : {value: '5.0'},
				name               : {__text: name},
				textureDictionary  : {__text: name},
				clipDictionary     : {},
				drawableDictionary : {},
				physicsDictionary  : {__text: 'prop_' + name},
				assetType          : {__text: 'ASSET_TYPE_DRAWABLE'},
				assetName          : {__text: name},
				extensions         : {},
			}

			const node = createNode(this.doc, 'Item', children);

			node.setAttribute('type', 'CBaseArchetypeDef');

			xpath('//CMapTypes/archetypes', this.doc)[0].appendChild(node);

		} else {

			xpath('//CMapTypes/archetypes', this.doc)[0].appendChild(name);

		}

	}

	addEntity(entity, initialPos, initialRot) {
		
		const newNode       = entity.cloneNode(true);
		const positionNode  = newNode.getElementsByTagName('position')[0];
		const rotationNode  = newNode.getElementsByTagName('rotation')[0];
		const object3D      = new THREE.Object3D();;

		// Position
		object3D.position.set(
			parseFloat(positionNode.getAttribute('x')),
			parseFloat(positionNode.getAttribute('y')),
			parseFloat(positionNode.getAttribute('z')),
		)

		const newPos = object3D.position.sub(initialPos)

		// Rotation
		object3D.applyQuaternion(new THREE.Quaternion(
			parseFloat(rotationNode.getAttribute('x')),
			parseFloat(rotationNode.getAttribute('y')),
			parseFloat(rotationNode.getAttribute('z')),
			parseFloat(rotationNode.getAttribute('w')),
		));

		const rotationEuler = new THREE.Euler()
		rotationEuler.setFromQuaternion(initialRot);

		rotateAboutPoint(object3D, initialPos, new THREE.Vector3(1.0, 0.0, 0.0), rotationEuler.x * Math.PI / 180);
		rotateAboutPoint(object3D, initialPos, new THREE.Vector3(0.0, 1.0, 0.0), rotationEuler.y * Math.PI / 180);
		rotateAboutPoint(object3D, initialPos, new THREE.Vector3(0.0, 0.0, 1.0), rotationEuler.z * Math.PI / 180);

		const newRot = object3D.quaternion;

		// Set new values
		positionNode.setAttribute('x', newPos.x.toFixed(8))
		positionNode.setAttribute('y', newPos.y.toFixed(8))
		positionNode.setAttribute('z', newPos.z.toFixed(8))

		rotationNode.setAttribute('x', newRot.x.toFixed(8))
		rotationNode.setAttribute('y', newRot.y.toFixed(8))
		rotationNode.setAttribute('z', newRot.z.toFixed(8))
		rotationNode.setAttribute('w', newRot.w.toFixed(8))

		this.entitiesContainer.appendChild(newNode);

		return newNode;
	}

	addEntityToRoom(entity, roomName) {

		if(typeof this.roomAttachedObjects[roomName] != 'undefined') {

			const entities = this.entities;

			for(let i=0; i<entities.length; i++) {
				if(entity == entities[i]) {
					this.roomAttachedObjects[roomName].push(i);
					break;
				}
			}

		}

	}

	normalizeHashes() {

		const entities       = this.entities;
		const archetypeNames = xpath('//CMapTypes/archetypes/Item[@type="CMloArchetypeDef"]/entities/Item/archetypeName', this.doc);

		for(let i=0; i<archetypeNames.length; i++) {
			
			this.emit('entity.normalize', i, archetypeNames.length - 1)
			
			if(archetypeNames[i].textContent.substr(0, 2) == '0x')
				archetypeNames[i].textContent = 'hash_' + archetypeNames[i].textContent.substr(2, archetypeNames[i].textContent.length).toUpperCase();

		}

	}

}


module.exports = {
	YMAP      : YMAP,
	YTYP      : YTYP,
	Vector3   : THREE.Vector3,
	Quaternion: THREE.Quaternion,
};