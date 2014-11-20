<?php $base_path = ""; ?>
<!doctype html>
<html lang="fr" xmlns:og="http://ogp.me/ns#">
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
		<title>Game Prototype - Client</title>
		<script type="text/javascript" src="<?php print $base_path; ?>libs/jquery-2.1.1.min.js"></script>
		<script type="text/javascript" src="<?php print $base_path; ?>libs/underscore-min.js"></script>
		<script type="text/javascript" src="<?php print $base_path; ?>libs/backbone-min.js"></script>
		<script type="text/javascript" src="<?php print $base_path; ?>libs/backbone.wreqr.js"></script>
		<script type="text/javascript" src="<?php print $base_path; ?>libs/backbone.marionette.min.js"></script>
		<script type="text/javascript" src="<?php print $base_path; ?>libs/backbone-super-min.js"></script>
		<script type="text/javascript" src="<?php print $base_path; ?>libs/phaser.io/phaser.min.js"></script>
		<script type="text/javascript" src="<?php print $base_path; ?>app.js"></script>
	</head>
	<body>
		<h1>Game Prototype - <em>Client</em></h1>
		<script type="text/javascript">
			window.game = new GameApp({});
		</script>
	</body>
</html>
