/**
 * Game Client
 *
 * @version 1.0
 **/

window.CONFIGURATION = {
	MAP 				: {
		WIDTH	: 2000,
		HEIGHT	: 2000
	},

	SCREEN_RESOLUTION	: {
		WIDTH	: 800,
		HEIGHT	: 600
	},

	CHARACTER			: {
		MOVE			: {
			HISTORY_LIMIT	: 50,
			SPEED			: 200,
			FPS				: 4,
			TOP_LABEL		: "top",
			RIGHT_LABEL		: "right",
			BOTTOM_LABEL	: "bottom",
			LEFT_LABEL		: "left"
		},
		ANGLE_45D_MULTIPLIER	: .7071,
		DIRECTION		: {
			NONE			: "",
			TOP				: "t",
			TOP_RIGHT		: "tr",
			RIGHT			: "r",
			RIGHT_BOTTOM	: "rb",
			BOTTOM			: "b",
			BOTTOM_LEFT		: "bl",
			LEFT			: "l",
			TOP_LEFT		: "tl"
		}
	}
};

window.COMMANDS = {
	MOVE	: {
		UP		: 0x01,
		DOWN	: 0x02,
		LEFT	: 0x03,
		RIGHT	: 0x04
	},

	STANDS	: {
		UP		: 0x05,
		DOWN	: 0x06,
		LEFT	: 0x07,
		RIGHT	: 0x08
	}
};

window.REQUESTS = {
	CLOCK	: {
		TICK_OFFSET : 0x01
	}
};

window.EVENTS = {
	GAME_INIT			: "game:init",
	GAME_PRELOAD		: "game:preload",
	GAME_CREATE			: "game:create",
	GAME_UPDATE			: "game:update",
	GAME_RENDER			: "game:render",

	CHARACTER_MOVE		: "character:move",
	CHARACTER_STANDS	: "character:stands"
};

var Shortcut = Marionette.Object.extend({
	command		: null,
	key			: null,
	params		: null,

	initialize : function (command, key, params) {
		this.command = command;
		this.key = key;
		this.params = params;
	}
});

var Logger = {
	log : function (obj, message, object) {
		if (window["console"] != null && obj.debug) {
			if (object) {
				console.log("[" + obj.name + "] " + message, object);
			} else {
				console.log("[" + obj.name + "] " + message);
			}
		}
	}
};

var SmartController = Marionette.Controller.extend({
	debug		: true,
	name		: null,
	engine		: null,
	game		: null,
	channel		: null,
	vent		: null,
	commands	: null,
	reqres		: null,

	initialize : function (name) {
		this.name = name;

		this.channel = Backbone.Wreqr.radio.channel("global");
		this.vent = this.channel.vent;
		this.commands = this.channel.commands;
		this.reqres = this.channel.reqres;

		/* Initialisation */
		this.vent.on(EVENTS.GAME_INIT, _.bind(function(params) {
			this.engine = params.engine;

			Logger.log(this, "engine received");
		}, this));
	}
});

var GFXEngine = SmartController.extend({
	initialize : function () {
		SmartController.prototype.initialize.apply(this, ["GFXEngine"]);

		// bind update & render functions
		this.vent.on(EVENTS.GAME_UPDATE, _.bind(this.update, this));
		this.vent.on(EVENTS.GAME_RENDER, _.bind(this.render, this));

		Logger.log(this, "Initialized!");
	},

	update	: function () {
		
	},

	render	: function () {
		
	}
});

var GFXInterface = SmartController.extend({
	initialize : function () {
		SmartController.prototype.initialize.apply(this, ["GFXInterface"]);

		// bind update & render functions
		this.vent.on(EVENTS.GAME_UPDATE, _.bind(this.update, this));
		this.vent.on(EVENTS.GAME_RENDER, _.bind(this.render, this));

		Logger.log(this, "Initialized!");
	},

	update	: function () {
		
	},

	render	: function () {
		
	}
});

var BaseUnit = SmartController.extend({
	move_speed		: 4,

	initialize : function () {
		SmartController.prototype.initialize.apply(this, ["BaseUnit"]);

		Logger.log(this, "Initialized!");
	}
});

var CharacterDirection = Marionette.Object.extend({
	direction	: CONFIGURATION.CHARACTER.DIRECTION.NONE,

	left		: {
		active	: false,
		pushed	: false
	},
	top			: {
		active	: false,
		pushed	: false
	},
	right		: {
		active	: false,
		pushed	: false
	},
	bottom		: {
		active	: false,
		pushed	: false
	},

	initialize : function () {
	},

	set : function (dir) {
		switch (dir) {
			case CONFIGURATION.CHARACTER.MOVE.LEFT_LABEL :
				this.left.active = this.left.pushed = true;
				this.right.active = false;
			break;

			case CONFIGURATION.CHARACTER.MOVE.RIGHT_LABEL :
				this.right.active = this.right.pushed = true;
				this.left.active = false;
			break;

			case CONFIGURATION.CHARACTER.MOVE.TOP_LABEL :
				this.top.active = this.top.pushed = true;
				this.bottom.active = false;
			break;

			case CONFIGURATION.CHARACTER.MOVE.BOTTOM_LABEL :
				this.bottom.active = this.bottom.pushed = true;
				this.top.active = false;
			break;

			default :
				return;
			break;
		}

		this.updateDirection();
	},

	unset : function (dir) {
		switch (dir) {
			case CONFIGURATION.CHARACTER.MOVE.LEFT_LABEL :
				this.left.active = this.left.pushed = false;
				if (this.right.pushed) this.right.active = true;
			break;

			case CONFIGURATION.CHARACTER.MOVE.RIGHT_LABEL :
				this.right.active = this.right.pushed = false;
				if (this.left.pushed) this.left.active = true;
			break;

			case CONFIGURATION.CHARACTER.MOVE.TOP_LABEL :
				this.top.active = this.top.pushed = false;
				if (this.bottom.pushed) this.bottom.active = true;
			break;

			case CONFIGURATION.CHARACTER.MOVE.BOTTOM_LABEL :
				this.bottom.active = this.bottom.pushed = false;
				if (this.top.pushed) this.top.active = true;
			break;

			default :
				return;
			break;
		}

		this.updateDirection();
	},

	getDirection : function () {
		return this.direction;
	},

	updateDirection : function () {
		this.direction = CONFIGURATION.CHARACTER.DIRECTION.NONE;
		if (this.top.active) this.direction += CONFIGURATION.CHARACTER.DIRECTION.TOP;
		if (this.right.active) this.direction += CONFIGURATION.CHARACTER.DIRECTION.RIGHT;
		if (this.bottom.active) this.direction += CONFIGURATION.CHARACTER.DIRECTION.BOTTOM;
		if (this.left.active) this.direction += CONFIGURATION.CHARACTER.DIRECTION.LEFT;
	}
});

/*
 * Handle network time synchronization and average the current lag
 */
var NetworkSynchronization = Marionette.Object.extend({
	srv_time_offset	: 0,
	avg_lag			: 0,
	ping_sample		: _([]),

	ping_sample_struct	: {
		id				: 0,
		srv_time		: 0,
		sent_time		: 0,
		received_time	: 0,
		confirmed		: false
	},

	updateSample	: function (sample) {
		this.ping_sample.push(sample);
		while (this.ping_sample.where({ confirmed : true }).size() > 5) {
			this.ping_sample.shift();
		}
		this.checkAvgLag();
	},

	getServerTime : function () {
		return _.now() + this.avg_lag / 2 + this.srv_time_offset;
	},

	newSample : function () {
		var sample = _.defaults({ id : _.uniqueId(), sent_time : _.now() }, this.ping_sample_struct);
		this.ping_sample.add(sample);
		return sample;
	},

	checkAvgLag : function () {
		//the samples on which we want to average the latency
		var samples = this.ping_sample.where({ confirmed : true });
		samples.filter(function (obj) {
			return obj.received_time - obj.sent_time < this.avg_lag * 3;
		}, this);

		var sum = 0;
		for (var i = 0, l = samples.size(); i < l; i++) {
			var obj = samples[i];
			sum += parseInt(obj.received_time, 10) - parseInt(obj.sent_time, 10);
		}
		this.avg_lag = Math.round(sum / l / 2);
	}
});

var CharacterMoveXY = Marionette.Object.extend({
	x			: 0,
	y			: 0,
	command		: null,
	timestamp	: 0,

	initialize : function (x, y, timestamp) {
		this.x = x;
		this.y = y;
		this.timestamp = Date.now();
	}
});

/*
 * 
 */
var CharacterCommandsHistory = Marionette.Object.extend({
	moves			: [],

	initialize : function () {

	},

	add : function (char_move_xy) {
		var stamp = this.getCurrentTimestamp();
		if (this.history_limit >= this.moves.length) {
			this.moves.pop();
		}

		if (char_move_xy.timestamp == null) {
			char_move_xy.timestamp = stamp;
		}
		this.moves.unshift(char_move_xy);
	},

	getByTime : function () {

	},

	getCurrentTimestamp : function () {
		return Date.now();
	}
});

var Clock = SmartController.extend({
	current_tick				: 0,
	current_tick_offset 		: 0,
	current_tick_offset_seconds	: 0,
	last_render_tick			: 0,

	initialize : function () {
		SmartController.prototype.initialize.apply(this, ["Clock"]);

		this.vent.on(EVENTS.GAME_CREATE, _.bind(this.create, this));
		this.vent.on(EVENTS.GAME_UPDATE, _.bind(this.update, this));

		this.reqres.setHandler(REQUESTS.CLOCK.TICK_OFFSET, _.bind(this.requestTickOffset, this));
	},

	create : function () {
		// initialize game ticks
		this.last_render = this.current_tick = Date.now();
	},

	update : function () {
		this.last_render_tick = this.current;
		this.current = Date.now();
		this.current_tick_offset = this.current - this.last_render_tick;
		this.current_tick_offset_seconds = this.current_tick_offset * .001;
	},

	requestTickOffset : function() {
		return this.current_tick_offset_seconds;
	},

	getCurrentTickOffset : function () {
		return this.current_tick_offset;
	},

	getCurrentTickOffsetSeconds : function () {
		return this.current_tick_offset_seconds;
	}
});

var Character = BaseUnit.extend({
	controls	: {
		top : {
			label	: CONFIGURATION.CHARACTER.MOVE.TOP_LABEL,
			obj		: null,
			key		: Phaser.Keyboard.E
		},
		bottom : {
			label	: CONFIGURATION.CHARACTER.MOVE.BOTTOM_LABEL,
			obj		: null,
			key		: Phaser.Keyboard.D
		},
		left : {
			label	: CONFIGURATION.CHARACTER.MOVE.LEFT_LABEL,
			obj		: null,
			key		: Phaser.Keyboard.S
		},
		right : {
			label	: CONFIGURATION.CHARACTER.MOVE.RIGHT_LABEL,
			obj		: null,
			key		: Phaser.Keyboard.F
		}
	},
	she					: null,
	commands_history	: null,
	move_direction		: null,
	char_direction		: null,
	tick_offset			: 0,

	initialize : function () {
		BaseUnit.prototype.initialize.apply(this);
		this.name = "Character";
		this.commands_history = new CharacterCommandsHistory();

		this.char_direction = new CharacterDirection();

		this.vent.on(EVENTS.GAME_PRELOAD, _.bind(this.preload, this));
		this.vent.on(EVENTS.GAME_CREATE, _.bind(this.create, this));
		this.vent.on(EVENTS.GAME_UPDATE, _.bind(this.update, this));

		/* Mouvements */
		// this.commands.setHandler(EVENTS.CHARACTER_MOVE, _.bind(this.move, this));
		// this.commands.setHandler(EVENTS.CHARACTER_STANDS, _.bind(this.stands, this));

		Logger.log(this, "Initialized!");
	},

	preload : function () {
		this.engine.load.atlasJSONHash("she", "assets/character/she/she.png", "assets/character/she/she.json");
	},

	create : function () {
		this.she = this.engine.add.sprite(50, 50, "she");

		//move top animation
		this.she.animations.add("walks-top", ["walks-top-1", "walks-top-2", "walks-top-3", "walks-top-4"], CONFIGURATION.CHARACTER.MOVE.FPS, true);

		//move right animation
		this.she.animations.add("walks-right", ["walks-right-1", "walks-right-2", "walks-right-3", "walks-right-4"], CONFIGURATION.CHARACTER.MOVE.FPS, true);

		//move bottom animation
		this.she.animations.add("walks-bottom", ["walks-bottom-1", "walks-bottom-2", "walks-bottom-3", "walks-bottom-4"], CONFIGURATION.CHARACTER.MOVE.FPS, true);

		//move left animation
		this.she.animations.add("walks-left", ["walks-left-1", "walks-left-2", "walks-left-3", "walks-left-4"], CONFIGURATION.CHARACTER.MOVE.FPS, true);

		//move top animation
		this.she.animations.add("stands-top", ["stands-top"], 1, false);

		//move right animation
		this.she.animations.add("stands-right", ["stands-right"], 1, false);

		//move bottom animation
		this.she.animations.add("stands-bottom", ["stands-bottom"], 1, false);

		//move left animation
		this.she.animations.add("stands-left", ["stands-left"], 1, false);

		// listen to key events
		// this.controls = this.engine.input.keyboard.addKeyCapture(this.controls);
		for (var index in this.controls) {
			// Logger.log(this, "moveKeyListen", this.controls);
			var shortcut = this.controls[index];
			shortcut.obj = this.engine.input.keyboard.addKey(shortcut.key);
			shortcut.obj.onDown.add(this.moveKeyListen, this);
			shortcut.obj.onUp.add(this.moveKeyListen, this);
		}
	},

	moveKeyListen : function (e) {
		for (var index in this.controls) {
			var shortcut = this.controls[index];

			if (e.keyCode != shortcut.key) continue;
			if (shortcut.obj.isDown) {
				this.char_direction.set(shortcut.label);
			} else {
				this.char_direction.unset(shortcut.label);
			}
		}
	},

	move : function (params) {
		Logger.log(this, "params", params);
		/*switch (params.move) {
			case "top" :
				this.she.animations.play("walks-top");
			break;

			case "right" :
				this.she.animations.play("walks-right");
			break;

			case "bottom" :
				this.she.animations.play("walks-bottom");
			break;

			case "left" :
				this.she.animations.play("walks-left");
			break;
		}

		this.last_direction = params.move;*/
	},

	stands : function (params) {
		Logger.log(this, "params", params);
		/*switch (params.move) {
			case "top" :
				this.she.animations.play("stands-top");
			break;

			case "right" :
				this.she.animations.play("stands-right");
			break;

			case "bottom" :
				this.she.animations.play("stands-bottom");
			break;

			case "left" :
				this.she.animations.play("stands-left");
			break;
		}*/
	},

	update : function () {
		var tick_offset_seconds = this.reqres.request(REQUESTS.CLOCK.TICK_OFFSET);
		var move_offset = CONFIGURATION.CHARACTER.MOVE.SPEED * tick_offset_seconds;
		var char_direction = this.char_direction.getDirection();

		if (char_direction != CONFIGURATION.CHARACTER.DIRECTION.NONE) {
			switch (char_direction) {
				case CONFIGURATION.CHARACTER.DIRECTION.TOP :
					this.she.y -= move_offset;
					this.she.animations.play("walks-top");
				break;

				case CONFIGURATION.CHARACTER.DIRECTION.TOP_RIGHT :
					this.she.y -= move_offset * CONFIGURATION.CHARACTER.ANGLE_45D_MULTIPLIER;
					this.she.x += move_offset * CONFIGURATION.CHARACTER.ANGLE_45D_MULTIPLIER;
				break;

				case CONFIGURATION.CHARACTER.DIRECTION.RIGHT :
					this.she.x += move_offset;
					this.she.animations.play("walks-right");
				break;

				case CONFIGURATION.CHARACTER.DIRECTION.RIGHT_BOTTOM :
					this.she.y += move_offset * CONFIGURATION.CHARACTER.ANGLE_45D_MULTIPLIER;
					this.she.x += move_offset * CONFIGURATION.CHARACTER.ANGLE_45D_MULTIPLIER;
				break;

				case CONFIGURATION.CHARACTER.DIRECTION.BOTTOM :
					this.she.y += move_offset;
					this.she.animations.play("walks-bottom");
				break;

				case CONFIGURATION.CHARACTER.DIRECTION.BOTTOM_LEFT :
					this.she.y += move_offset * CONFIGURATION.CHARACTER.ANGLE_45D_MULTIPLIER;
					this.she.x -= move_offset * CONFIGURATION.CHARACTER.ANGLE_45D_MULTIPLIER;
				break;

				case CONFIGURATION.CHARACTER.DIRECTION.LEFT :
					this.she.x -= move_offset;
					this.she.animations.play("walks-left");
				break;

				case CONFIGURATION.CHARACTER.DIRECTION.TOP_LEFT :
					this.she.y -= move_offset * CONFIGURATION.CHARACTER.ANGLE_45D_MULTIPLIER;
					this.she.x -= move_offset * CONFIGURATION.CHARACTER.ANGLE_45D_MULTIPLIER;
				break;
			}
		} else {
			this.she.animations.play("stands-bottom");
		}
	}
});

var Ennemy = BaseUnit.extend({
	initialize : function () {
		BaseUnit.prototype.initialize.apply(this);
		this.name = "Ennemy";

		Logger.log(this, "Initialized!");
	}
});

var Ennemies = SmartController.extend({
	initialize : function () {
		SmartController.prototype.initialize.apply(this, ["Ennemies"]);

		Logger.log(this, "Initialized!");
	}
});

var Inputs = SmartController.extend({
	controls	: {
		top : {
			label	: CONFIGURATION.CHARACTER.MOVE.TOP_LABEL,
			obj		: null,
			key		: Phaser.Keyboard.E
		},
		bottom : {
			label	: CONFIGURATION.CHARACTER.MOVE.BOTTOM_LABEL,
			obj		: null,
			key		: Phaser.Keyboard.D
		},
		left : {
			label	: CONFIGURATION.CHARACTER.MOVE.LEFT_LABEL,
			obj		: null,
			key		: Phaser.Keyboard.S
		},
		right : {
			label	: CONFIGURATION.CHARACTER.MOVE.RIGHT_LABEL,
			obj		: null,
			key		: Phaser.Keyboard.F
		},
	},
	mouse		: null,

	initialize : function () {
		SmartController.prototype.initialize.apply(this, ["Inputs"]);

		// this.vent.on(EVENTS.GAME_CREATE, _.bind(this.create, this));
		// this.vent.on(EVENTS.GAME_UPDATE, _.bind(this.update, this));

		Logger.log(this, "Initialized!");
	},

	create : function () {
		// listen to key events
		// this.controls = this.engine.input.keyboard.addKeyCapture(this.controls);
		for (var index in this.controls) {
			var shortcut = this.controls[index];
			shortcut.obj = this.engine.input.keyboard.addKey(shortcut.key);
		}
	},

	update : function () {
		Logger.log(this, "Im here");
		for (var index in this.controls) {
			var shortcut = this.controls[index];

			if (shortcut.obj.isDown) {
				this.commands.execute(EVENTS.CHARACTER_MOVE, { move : shortcut.label });
			}
		}


	}
});

var Network = SmartController.extend({
	initialize : function () {
		SmartController.prototype.initialize.apply(this, ["Network"]);

		Logger.log(this, "Initialized!");
	}
});

/**
 * Main Application Class
 *
 * Contains everything
 **/
var GameApp = Marionette.Application.extend({
	name			: "GameApp",
	debug			: true,
	
	options			: null,
	engine			: null,
	character		: null,
	enemies			: null,
	gfx_engine		: null,
	gfx_interface	: null,
	network			: null,
	inputs			: null,
	clock			: null,

	initialize : function (options) {
		/* Store options */
		this.options = options;

		/* Clock */
		this.clock = new Clock();

		/* GFXEngine */
		this.gfx_engine = new GFXEngine();

		/* GFXInterface */
		this.gfx_interface = new GFXInterface();

		/* Network */
		this.network = new Network();

		/* Character */
		this.character = new Character();

		/* Ennemies */
		this.ennemies = new Ennemies();

		/* Inputs */
		this.inputs = new Inputs();

		/* Initialize the game engine */
		this.engine = new Phaser.Game(CONFIGURATION.SCREEN_RESOLUTION.WIDTH, CONFIGURATION.SCREEN_RESOLUTION.HEIGHT, Phaser.CANVAS, "r9-game", {
			preload	: _.bind(this.preload, this),
			create	: _.bind(this.create, this),
			update	: _.bind(this.update, this),
			render	: _.bind(this.render, this)
		});

		this._init();
	},

	_init : function() {
		this.vent.trigger(EVENTS.GAME_INIT, { engine : this.engine });
	},

	preload : function() {
		this.vent.trigger(EVENTS.GAME_PRELOAD, {});
		this.engine.time.advancedTiming = true;
	},

	create : function() {
		this.vent.trigger(EVENTS.GAME_CREATE, {});
	},

	update : function() {
		this.vent.trigger(EVENTS.GAME_UPDATE, {});
	},

	render : function() {
		this.vent.trigger(EVENTS.GAME_RENDER, {});

		this.engine.debug.text(this.engine.time.fps || '--', 2, 14, "#00ff00");
	}
});
