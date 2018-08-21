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
    prevx: 0,
    prevy: 0,
    currx: 0,
    curry: 0,
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
        this.ctx.moveTo(this.prevx, this.prevy)
        this.ctx.lineTo(this.currx, this.curry)
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

        this.prevx = this.currx
        this.prevy = this.curry
        this.currx = e.layerX
        this.curry = e.layerY

        if(action == 'down') {
            this.drawing = true 

            this.ctx.beginPath() 
            this.ctx.fillStyle = this.line.color
            this.ctx.arc(this.currx, this.curry, this.line.width / 2, 0, Math.PI * 2, false)
            this.ctx.closePath() 
        }

        if(action == 'move' && this.drawing) {
            this.drawLine()
        }
    }
}

export default drawCanvas