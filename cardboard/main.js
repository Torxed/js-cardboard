<!DOCTYPE html>
<html>
<head>
	<title>Gboard</title>
	<style type="text/css">
		:root {
			--grey: #BABABA;
			--blue: #4283F2;
			--gray-ish: #F6F6F6;
		}

		html, body {
			position: absolute;
			margin: 0px;
			padding: 0px;
			left: 0px;
			top: 0px;
			width: 100%;
			height: 100%;
			overflow: auto;
			background-color: #F6F6F6;

			display: flex;
		}

		.card {
			background-color: #FFFFFF;
		}

		.line {
			background-color: #4283F2;
		}

		.gout-board {
			background-color: #F6F6F6;
			flex-grow: 1;
		}
	</style>
	<script type="text/javascript">
		let goutDebugContext = null;

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

		class goutCard {
			constructor(title, description, icon, x, y, values={}) {
				this.title = title;
				this.description = description;
				this.values = values;
				this.context = null;
				this.connected_entities = {};

				this.x = x;
				this.y = y;
				this.width = 200;
				this.height = 100;

				this.renderable = false;
				this.image = new Image;
				this.image.addEventListener('load', e => {
					this.renderable = true;
					if(this.context) 
						this.render(this.context);
				})
				this.image.src = icon;
			}

			connect(obj) {
				this.connected_entities[Object.keys(this.connected_entities).length] = obj;
			}

			drawArrowTo(fromx, fromy, tox, toy) {
				let headlen = 10; // length of head in pixels
				let dx = tox - fromx;
				let dy = toy - fromy;
				let angle = Math.atan2(dy, dx);
				this.context.beginPath();
				this.context.strokeStyle = "#4283F2";
				this.context.lineWidth = 3;

				this.context.moveTo(fromx, fromy);
				this.context.lineTo(tox, toy);
				this.context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
				this.context.moveTo(tox, toy);
				this.context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));

				this.context.stroke();
			}

			render(context) {
				if (this.renderable) {
					this.drawShadow();

					Object.keys(this.connected_entities).forEach((key) => {
						let src_closest_point = closestSideFromSrcToTarget(this, this.connected_entities[key]);
						let dst_closest_point = closestSideFromSrcToTarget(this.connected_entities[key], src_closest_point);

						this.drawArrowTo(src_closest_point.x, src_closest_point.y, dst_closest_point.x, dst_closest_point.y)
					})

					this.drawBox();
					let pentagonPosition = this.drawPentagon();

					// Color change: https://stackoverflow.com/questions/27596652/change-svg-fill-color-and-then-draw-to-canvas
					this.context.drawImage(this.image, 0, 0, 64, 64, pentagonPosition.x-8, pentagonPosition.y-8, 64, 64);

					this.drawTitle();
					this.drawDescription();
					this.drawHeaderLine();
				}

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

				this.context.strokeStyle = "#4283F2";
				this.context.fillStyle = "#4283F2";
				this.context.lineWidth = 1;
				this.context.stroke();
				this.context.fill();

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

		class gCPU extends goutCard {
			constructor(values, x, y) {
				super("CPU", "A cpu info", "./resources/images/GoogleIcons/Expanded Product Card Icons/Compute-Engine.svg", x, y, values);
			}
		}

		class PCIBus extends goutCard {
			constructor(values, x, y) {
				super("PCIe Bus", "A PCIe Root Bus", "./resources/images/GoogleIcons/Expanded Product Card Icons/Compute-Engine.svg", x, y, values);
			}
		}

		class goutBoard {
			constructor(DOMIdentifier) {
				this.DOMIdentifier = DOMIdentifier;
				this.DOMElement = document.querySelector(`.${DOMIdentifier}`);

				this.DOMElement.parentElement.addEventListener('resize', this.resize);
				this.resize();

				if (!this.DOMElement) {
					this.working = false;
					console.error(`Could not locate DOM Element "${DOMIdentifier}" for gout-board. No board will be rendered`);
				} else {
					this.working = true;
					this.context = this.DOMElement.getContext('2d');
				}

				this.sprites = {};
			}

			resize() {
				let parentDimensions = this.DOMElement.parentElement.getBoundingClientRect();
				this.DOMElement.setAttribute('width', parentDimensions.width);
				this.DOMElement.setAttribute('height', parentDimensions.height);
			}

			clear() {
				this.context.fillStyle = "#424242";
				this.context.fillRect(0, 0, 300, 150);
				this.context.clearRect(20, 20, 100, 50);
			}

			render() {
				if (this.working) {
					Object.keys(this.sprites).forEach((key) => {
						this.sprites[key].render(this.context);
					})
				}
			}

			add_card(cardObject) {
				cardObject.context = this.context;
				this.sprites[Object.keys(this.sprites).length] = cardObject;
			}
		}

		let gboard = null;
		window.onload = () => {
			gboard = new goutBoard('gout-board');

			let cpu = new gCPU({'bus' : 'pcie.0'}, 160, 100);
			let pcibus1 = new PCIBus({'bus' : 'pcie.0'}, 50, 300);
			let pcibus2 = new PCIBus({'bus' : 'pcie.0'}, 300, 300);

			cpu.connect(pcibus1);
			cpu.connect(pcibus2);

			gboard.add_card(cpu);
			gboard.add_card(pcibus1);
			gboard.add_card(pcibus2);

			gboard.render();
		}
	</script>
</head>
<body>
	<canvas class="gout-board">
		
	</canvas>
</body>
</html>
