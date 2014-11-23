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
		MOVE 		: {
			HISTORY_LIMIT	: 50,
			SPEED			: 80,
			FPS				: 4
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
	direction	: null,
	left		: false,
	top			: false,
	right		: false,
	bottom		: false,

	initialize : function () {
	},

	set : function (dir) {
		if (this[dir] == null) return;

		this[dir] = true;
	},

	unset : function (dir) {

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

var Character = BaseUnit.extend({
	controls	: {
		top : {
			label	: "top",
			obj		: null,
			key		: Phaser.Keyboard.E
		},
		bottom : {
			label	: "bottom",
			obj		: null,
			key		: Phaser.Keyboard.D
		},
		left : {
			label	: "left",
			obj		: null,
			key		: Phaser.Keyboard.S
		},
		right : {
			label	: "right",
			obj		: null,
			key		: Phaser.Keyboard.F
		},
	},
	she					: null,
	commands_history	: null,
	move_direction		: null,

	initialize : function () {
		BaseUnit.prototype.initialize.apply(this);
		this.name = "Character";
		this.commands_history = new CharacterCommandsHistory();

		this.vent.on(EVENTS.GAME_PRELOAD, _.bind(this.preload, this));
		this.vent.on(EVENTS.GAME_CREATE, _.bind(this.create, this));
		this.vent.on(EVENTS.GAME_UPDATE, _.bind(this.update, this));

		/* Mouvements */
		this.commands.setHandler(EVENTS.CHARACTER_MOVE, _.bind(this.move, this));
		this.commands.setHandler(EVENTS.CHARACTER_STANDS, _.bind(this.stands, this));

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
			var shortcut = this.controls[index];
			shortcut.obj = this.engine.input.keyboard.addKey(shortcut.key);
			shortcut.obj.onDown.add(this.move, this);
			shortcut.obj.onUp.add(this.stands, this);
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
		for (var index in this.controls) {
			var shortcut = this.controls[index];

			if (shortcut.obj.isDown) {
				this.commands.execute(EVENTS.CHARACTER_MOVE, { move : shortcut.label });

				switch (shortcut.label) {
					case "top" :
						this.she.y -= CONFIGURATION.CHARACTER.MOVE.SPEED;
					break;

					case "right" :
						this.she.x += CONFIGURATION.CHARACTER.MOVE.SPEED;
					break;

					case "bottom" :
						this.she.y += CONFIGURATION.CHARACTER.MOVE.SPEED;
					break;

					case "left" :
						this.she.x -= CONFIGURATION.CHARACTER.MOVE.SPEED;
					break;
				}
			}
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
			label	: "top",
			obj		: null,
			key		: Phaser.Keyboard.E
		},
		bottom : {
			label	: "bottom",
			obj		: null,
			key		: Phaser.Keyboard.D
		},
		left : {
			label	: "left",
			obj		: null,
			key		: Phaser.Keyboard.S
		},
		right : {
			label	: "right",
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

	initialize : function (options) {
		/* Store options */
		this.options = options;

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
	},

	create : function() {
		this.vent.trigger(EVENTS.GAME_CREATE, {});
	},

	update : function() {
		this.vent.trigger(EVENTS.GAME_UPDATE, {});
	},

	render : function() {
		this.vent.trigger(EVENTS.GAME_RENDER, {});
	}
});
