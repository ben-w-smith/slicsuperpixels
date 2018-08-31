// Todo: 
// 1 - make prev and curr objects rather than 4 separate vars
// 2 - move drawLine and findxy outside of object so they are private methods

var drawCanvas = {
	canvas: false,
	ctx: false,
	line: {
		color: "green",
		width: 10,
	},
	drawing: false,
	prev: {
		x: 0,
		y: 0,
	},
	curr: {
		x: 0,
		y: 0,
	},
	canvasEvents: [
		{ 
			event: "mousemove",
			action: "move",
		},
		{
			event: "mousedown",
			action: "down",
		},
		{
			event: "mouseup",
			action: "up",
		},
		{
			event: "mouseout",
			action: "out",
		},
	],
	init: function(canvas) {
		this.canvas = canvas
		this.canvas.style.opacity = "0.65"
		this.ctx = this.canvas.getContext('2d')
		this.canvasEvents.forEach(function(cEvent) {
			this.canvas.addEventListener(cEvent.event, function(e) {
				this.findxy(cEvent.action, e)
			}.bind(this), false)
		}.bind(this))
	},
	setColor: function(color) {
		this.line.color = color
	},
	eraseAll: function() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
	},
	drawLine: function() {
		this.ctx.beginPath()
		this.ctx.moveTo(this.prev.x, this.prev.y)
		this.ctx.lineTo(this.curr.x, this.curr.y)
		this.ctx.strokeStyle = this.line.color
		this.ctx.lineJoin = "round"
		this.ctx.lineWidth = this.line.width
		this.ctx.closePath()
		this.ctx.stroke()
	},
	findxy: function(action, e) {
		if(action == 'up' || action == 'out') {
			this.drawing = false
			return
		}

		this.prev.x = this.curr.x
		this.prev.y = this.curr.y
		this.curr.x = e.layerX
		this.curr.y = e.layerY

		if(action == 'down') {
			this.drawing = true 

			this.ctx.beginPath() 
			this.ctx.fillStyle = this.line.color
			this.ctx.arc(this.curr.x, this.curr.y, this.line.width / 2, 0, Math.PI * 2, false)
			this.ctx.closePath() 
		}

		if(action == 'move' && this.drawing) {
			this.drawLine()
		}
	}
}

export default drawCanvas