var drawCanvas = {
    canvas: false,
    ctx: false,
    line: {
        color: "green",
        width: 2,
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
        this.ctx.lineWidth = this.line.width
        this.ctx.stroke()
        this.ctx.closePath()
    },
    findxy: function(action, e) {
        if(action == 'up' || action == 'out') {
            this.drawing = false
            return
        }

        this.prevx = this.currx
        this.prevy = this.curry
        this.currx = e.clientX - this.canvas.offsetParent.offsetLeft
        this.curry = e.clientY - this.canvas.offsetParent.offsetTop
        // this.currx = e.layerX
        // this.curry = e.layerY

        if(action == 'down') {
            this.drawing = true 

            this.ctx.beginPath() 
            this.ctx.fillStyle = this.color
            this.ctx.fillRect(this.currx, this.curry, this.line.width, this.line.height) 
            this.ctx.closePath() 
        }

        if(action == 'move' && this.drawing) {
            this.drawLine()
        }
    }
}

module.exports = drawCanvas