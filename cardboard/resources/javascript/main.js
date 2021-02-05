Array.min = function( array ){
	return Math.min.apply( Math, array );
};

function closestSideFromSrcToTarget(dst, src) {
	let src_center = {'x' : src.x+src.width/2, 'y' : src.y+src.height/2};

	// let ... = Math.sqrt(Math.pow(dst.x - src_center.x, 2) + Math.pow(dst.y - src_center.y, 2))
	let dst_top_delta = Math.sqrt(Math.pow(dst.x+dst.width/2 - src_center.x, 2) + Math.pow(dst.y - src_center.y, 2))
	let dst_bot_delta = Math.sqrt(Math.pow(dst.x+dst.width/2 - src_center.x, 2) + Math.pow(dst.y+dst.height - src_center.y, 2))
	let dst_left_delta = Math.sqrt(Math.pow(dst.x - src_center.x, 2) + Math.pow(dst.y+dst.height/2 - src_center.y, 2))
	let dst_right_delta = Math.sqrt(Math.pow(dst.x+dst.width - src_center.x, 2) + Math.pow(dst.y+dst.height/2 - src_center.y, 2))

	let smallest_delta = Array.min([dst_top_delta, dst_bot_delta, dst_left_delta, dst_right_delta]);
	switch(smallest_delta) {
		case dst_top_delta:
			return {'x' : dst.x + dst.width/2, 'y' : dst.y, 'width' : 0, 'height' : 0}
		case dst_bot_delta:
			return {'x' : dst.x + dst.width/2, 'y' : dst.y + dst.height, 'width' : 0, 'height' : 0}
		case dst_left_delta:
			return {'x' : dst.x, 'y' : dst.y + dst.height/2, 'width' : 0, 'height' : 0}
		case dst_right_delta:
			return {'x' : dst.x + dst.width, 'y' : dst.y + dst.height/2, 'width' : 0, 'height' : 0}
	}
}

class cardBoardCard {
	constructor(title, description, icon, x, y, values={}) {
		this.title = title;
		this.description = description;
		this.values = values;
		this.context = null;
		this.connected_entities = {};
		this.sprites = {}
		this.parent = null;

		this.x = x;
		this.y = y;
		this.width = 200;
		this.height = 100;
		this.pentagonPosition = {'x' : 0, 'y' : 0}

		this.image = new Image;
		this.image.addEventListener('load', e => {
			if(this.context) 
				this.drawImage(this.parent);
		})
		this.image.src = icon;
	}

	connect(obj) {
		obj.x = this.x+((this.width+100)*Object.keys(this.connected_entities).length);
		obj.y = this.y+180;
		this.connected_entities[Object.keys(this.connected_entities).length] = obj;
	}

	render(parent) {
		if (this.parent) {
			this.context = parent.context;

			if (!this.parent.x)
				this.parent.x = this.x;
			else if (this.x < this.parent.x)
				this.parent.x = this.x;

			if (!this.parent.y)
				this.parent.y = this.y;
			else if (this.y < this.parent.y)
				this.parent.y = this.y;

			if (this.x+this.width > this.parent.width)
				this.parent.width = (this.x+this.width)-this.parent.x;
			if (this.y+this.height > this.parent.height)
				this.parent.height = (this.y+this.height)-this.parent.y;
			
			this.drawShadow();
			Object.keys(this.connected_entities).forEach((key) => {
				let src_closest_point = closestSideFromSrcToTarget(this, this.connected_entities[key]);
				let dst_closest_point = closestSideFromSrcToTarget(this.connected_entities[key], src_closest_point);

				this.drawArrowTo(src_closest_point.x, src_closest_point.y, dst_closest_point.x, dst_closest_point.y)
				this.connected_entities[key].parent = parent;
				this.connected_entities[key].context = this.context;
				this.connected_entities[key].render(parent);
			})

			this.drawBox();
			this.pentagonPosition = this.drawPentagon();
			this.drawImage();

			this.drawTitle();
			this.drawDescription();
			this.drawHeaderLine();
			this.drawValues();
		}

	}

	drawImage() {
		// Color change: https://stackoverflow.com/questions/27596652/change-svg-fill-color-and-then-draw-to-canvas
		if(this.parent)
			this.context.drawImage(this.image, 0, 0, 24, 24, this.pentagonPosition.x-8, this.pentagonPosition.y-8, 24, 24);
	}

	drawArrowTo(fromx, fromy, tox, toy) {
		let headlen = 10; // length of head in pixels
		let dx = tox - fromx;
		let dy = toy - fromy;
		let angle = Math.atan2(dy, dx);
		let padding = 40;
		this.context.beginPath();
		this.context.strokeStyle = "#4283F2";
		this.context.lineWidth = 3;

		this.context.moveTo(fromx, fromy);
		if (fromx != tox) {
			let halfway_x = (fromx+tox)/2;

			if (halfway_x < this.parent.x+this.parent.width)
				halfway_x = this.parent.x+this.parent.width+padding;

			this.context.lineTo(halfway_x, fromy);
			this.context.lineTo(halfway_x, toy);
			angle = Math.atan2(toy - fromy, tox + (fromx+tox)/2);
		}
		this.context.lineTo(tox, toy);

		this.context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
		this.context.moveTo(tox, toy);
		this.context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));

		this.context.stroke();
	}

	drawValues() {
		let start_y = this.y+82;
		Object.keys(this.values).forEach((key) => {
			this.context.font = "12px Arial";
			this.context.fillStyle = "#666666";
			this.context.fillText(`- ${key}: ${this.values[key]}`, this.x+75, start_y);
			start_y += 24;
		})
	}

	drawTitle() {
		this.context.font = "20px Arial";
		this.context.fillStyle = "#666666";
		this.context.fillText(this.title, this.x+75, this.y+35);
	}

	drawDescription() {
		this.context.font = "12px Arial";
		this.context.fillStyle = "#666666";
		this.context.fillText(this.description, this.x+76, this.y+50);
	}

	drawHeaderLine() {
		//C2C2C2
		this.context.beginPath();
		this.context.strokeStyle = "#C2C2C2";
		this.context.moveTo(this.x+76, this.y+62);
		this.context.lineTo(this.x+176, this.y+62);
		this.context.stroke()
	}

	drawPentagon() {
		let numberOfSides = 6;
		let size = 25;
		let padding = 15;

		let	Xcenter = this.x+size+padding,
			Ycenter = this.y+size+padding,
			step  = 2 * Math.PI / numberOfSides,//Precalculate step value
			shift = (Math.PI / 180.0);//Quick fix = * -18 ;)

		this.context.beginPath();
		//this.context.moveTo (Xcenter +  size * Math.cos(0), Ycenter +  size *  Math.sin(0));          

		for (let i = 0; i <= numberOfSides;i++) {
			let curStep = i * step + shift;
			this.context.lineTo (Xcenter + size * Math.cos(curStep), Ycenter + size * Math.sin(curStep));
		}

		this.context.strokeStyle = "#C2C2C2";
		this.context.fillStyle = "#4283F2";
		this.context.lineWidth = 1;
		this.context.fill();
		this.context.stroke();

		return {'x' : Xcenter, 'y' : Ycenter}
	}

	drawBox() {
		this.context.beginPath();

		this.context.lineTo(this.x, this.y);  // x
		this.context.lineTo(this.x+this.width, this.y); // x --> y
		this.context.lineTo(this.x+this.width, this.y+this.height); //       |
		this.context.lineTo(this.x, this.y+this.height);  // x <-- y
		this.context.lineTo(this.x, this.y);  // |

		this.context.strokeStyle = "#C2C2C2";
		this.context.fillStyle = "#FFFFFF";
		this.context.lineWidth = 1;
		this.context.stroke();
		this.context.fill();
	}

	drawShadow() {
		this.context.beginPath();

		this.context.lineTo(this.x+3, this.y+3);  // x
		this.context.lineTo(this.x+this.width+3, this.y+3); // x --> y
		this.context.lineTo(this.x+this.width+3, this.y+this.height+3); //       |
		this.context.lineTo(this.x+3, this.y+this.height+3);  // x <-- y
		this.context.lineTo(this.x+3, this.y+3);  // |

		this.context.fillStyle = "#C2C2C2";
		this.context.fill();
	}
}

class CPU extends cardBoardCard {
	constructor(values, x, y) {
		super("CPU", "A cpu info", "./cardboard/resources/images/GoogleIcons/Compute-Engine.svg", x, y, values);
	}
}

class PCIBus extends cardBoardCard {
	constructor(values, x, y) {
		super("PCIe Bus", "A PCIe Root Bus", "./cardboard/resources/images/GoogleIcons/Container-Engine.svg", x, y, values);
	}
}

class PCIPort extends cardBoardCard {
	constructor(values, x, y) {
		super("PCIe Port", "A PCIe Root Port", "./cardboard/resources/images/GoogleIcons/cloud-logging-512-color.svg", x, y, values);
	}
}

class PCIDevice extends cardBoardCard {
	constructor(description, values, x, y) {
		super("PCIe Device", description, "./cardboard/resources/images/GoogleIcons/cloud-logging-512-color.svg", x, y, values);
	}
}

class cardBoard {
	constructor(DOMIdentifier) {
		this.DOMIdentifier = DOMIdentifier;
		this.DOMElement = document.querySelector(`.${DOMIdentifier}`);

		window.addEventListener('resize', () => {
			this.resize();
		});
		this.resize();

		if (!this.DOMElement) {
			this.working = false;
			this.context = null;
			console.error(`Could not locate DOM Element "${DOMIdentifier}" for gout-board. No board will be rendered`);
		} else {
			this.working = true;
			this.context = this.DOMElement.getContext('2d');
		}

		this.sprites = {};
		this.x = null;
		this.y = null;
		this.width = 0;
		this.height = 0;
	}

	resize() {
		let parentDimensions = this.DOMElement.parentElement.getBoundingClientRect();
		this.DOMElement.setAttribute('width', parentDimensions.width);
		this.DOMElement.setAttribute('height', parentDimensions.height);
		this.render();
	}

	clear() {
		this.context.fillStyle = "#424242";
		this.context.fillRect(0, 0, 300, 150);
		this.context.clearRect(20, 20, 100, 50);
	}

	render() {
		if (this.working) {
			this.x = null;
			this.y = null;
			this.width = 0;
			this.height = 0;

			Object.keys(this.sprites).forEach((key) => {
				this.sprites[key].render(this);
			})
		//	this.context.beginPath();
		//	this.context.rect(this.x, this.y, this.width, this.height);
		//	this.context.stroke();
		}

	}

	add_card(cardObject) {
		cardObject.parent = this;
		cardObject.context = this.context;
		this.sprites[Object.keys(this.sprites).length] = cardObject;
	}
}