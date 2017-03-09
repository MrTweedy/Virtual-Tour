const cylSize = 200,
	  fov = 53,
	  imgFolder = "panoramas",
	  targetThickness = .01,
	  aspect = .5625,
	  portalColor = "#177121",
	  actionColor = "#ac2c06",
	  infoColor = "#ff6233",
	  camera = new THREE.PerspectiveCamera(fov, 1 / aspect),
	  defaultRoom = 10,
	  raycaster = new THREE.Raycaster(),
	  loader = new THREE.TextureLoader(),
	  targetMaterial = new THREE.MeshBasicMaterial({color:portalColor, transparent:true, opacity:.3}),
	  targetFrameMaterial = new THREE.LineBasicMaterial({color:portalColor, linewidth:2, transparent:true, opacity:.9}),
	  touchlineSamples = 15;

var DATA = {
	1:{//
		name:"Aerobics Room",
		img:"AEROBICS_ROOM.jpg",
		rotConstraint:[.8, .25],
		defaultStartAngle:.07,
		targets:[
			{targetID:0 , targetType:"portal", targetAction:15, targetName:"Go to Balcony Corner", H:40, W:35, X:0, Y:25, rotY: .419, startAngle:.05, yTilt:.03}
		],
	},
	2:{//
		name:"Cafe",
		img:"CAFE.jpg",
		rotConstraint:[],
		defaultStartAngle:.37,
		targets:[
			{targetID:0 , targetType:"portal", targetAction:10, targetName:"Go to Lobby", H:65, W:100, X:0, Y:-2, rotY:.155, startAngle:.7, yTilt:.87}
		]
	},
	3:{//
		name:"Childcare",
		img:"CHILDCARE.jpg",
		rotConstraint:[],
		defaultStartAngle:.9,
		targets:[
			{targetID:0 , targetType:"portal", targetAction:6, targetName:"Go to Fitness Floor", H:70, W:34, X:0, Y:22, rotY:.553, startAngle:.05, yTilt:.97}
		]
	},
	4:{//
		name:"Cycle Studio",
		img:"CYCLE_STUDIO.jpg",
		rotConstraint:[.8, .18],
		defaultStartAngle:.15,
		targets:[
			{targetID:0 , targetType:"portal", targetAction:15, targetName:"Go to Balcony Corner", H:78, W:62, X:0, Y:26, rotY: .302, startAngle:.15, yTilt:.965}
		]
	},
	5:{//
		name:"Basketball Court",
		img:"FLOOR_BB.jpg",
		rotConstraint:[],
		defaultStartAngle:.33,
		targets:[
			//{targetID:0 , targetType:"portal", targetAction:9, targetName:"Go to Free Weights", H:40, W:125, X:0, Y:15, rotY: .625, startAngle:.6, yTilt:.05},
			{targetID:1 , targetType:"portal", targetAction:9, targetName:"Go to Free Weights", H:50, W:35, X:0, Y:10, rotY: .825, startAngle:.8}
		]
	},
	6:{//
		name:"Fitness Floor",
		img:"FLOOR_CENTER.jpg",
		rotConstraint:[],
		defaultStartAngle:.5,
		targets:[
			//{targetID:0 , targetType:"portal", targetAction:10, targetName:"Go to Lobby", H:25, W:24, X:0, Y:72, rotY: .75, startAngle: .3},
			{targetID:1 , targetType:"portal", targetAction:15, targetName:"Go to Corner Balcony", H:25, W:25, X:0, Y:62, rotY: .895, startAngle: .65, yTilt:.95},
			//{targetID:2 , targetType:"portal", targetAction:13, targetName:"Go to South Balcony", H:20, W:30, X:0, Y:69, rotY: .845},
			{targetID:3 , targetType:"portal", targetAction:9, targetName:"Go to Free Weights", H:45, W:30, X:0, Y:27, rotY: .932, startAngle:.15, yTilt:.05},
			{targetID:4 , targetType:"portal", targetAction:7, targetName:"Go to Indoor Track", H:25, W:40, X:0, Y:43, rotY: .715, startAngle:.36, yTilt:.9},
			{targetID:5 , targetType:"portal", targetAction:12, targetName:"Go to Locker Room Entrance", H:20, W:40, X:0, Y:42, rotY: .839, startAngle:.5, yTilt:.97},
			{targetID:6 , targetType:"portal", targetAction:3, targetName:"Go to Childcare", H:35, W:75, X:0, Y:48, rotY: .43, startAngle:.95, yTilt:.04},
		]
	},
	7:{//
		name:"Indoor Track", 
		img:"FLOOR_CORNER.jpg",
		rotConstraint:[],
		defaultStartAngle:.5,
		targets:[
			{targetID:0 , targetType:"portal", targetAction:3, targetName:"Go to Childcare", H:25, W:50, X:0, Y:21, rotY: .19, startAngle:.95, yTilt:.15, zTilt:.99},
			{targetID:1 , targetType:"portal", targetAction:6, targetName:"Go to Fitness Floor", H:23, W:40, X:0, Y:21, rotY: .105, startAngle:.8},
			{targetID:2 , targetType:"portal", targetAction:12, targetName:"Go to Locker Room Entrance", H:23, W:30, X:0, Y:29, rotY: .845, startAngle:.4, yTilt:.95},
			{targetID:3 , targetType:"portal", targetAction:15, targetName:"Go to Corner Balcony", H:30, W:22, X:0, Y:33, rotY: .9035, startAngle: .6}
		]
	},
	8:{//
		name:"Raquetball Courts",
		img:"FLOOR_COURTS.jpg",
		rotConstraint:[],
		defaultStartAngle:.87,
		targets:[
			{targetID:0 , targetType:"portal", targetAction:7, targetName:"Go to Indoor Track", H:25, W:25, X:0, Y:20, rotY: .65, startAngle:.55},
			{targetID:1 , targetType:"portal", targetAction:14, targetName:"Go to Balcony West", H:18, W:45, X:0, Y:47, rotY: .505, startAngle:.85, yTilt:.05},
			{targetID:2 , targetType:"portal", targetAction:9, targetName:"Go to Free Weights", H:35, W:70, X:0, Y:23, rotY: .338, startAngle:.9},
			//{targetID:3 , targetType:"portal", targetAction:5, targetName:"Go to Basketball Court", H:35, W:20, X:0, Y:23, rotY: .295, startAngle:.7},
			{targetID:4 , targetType:"portal", targetAction:12, targetName:"Go to Locker Room Entrance", H:30, W:35, X:0, Y:20, rotY: .862, startAngle:.75},
			{targetID:5 , targetType:"portal", targetAction:15, targetName:"Go to Corner Balcony", H:40, W:40, X:0, Y:-9, rotY: .685, startAngle: .68, yTilt:.175},
			{targetID:6 , targetType:"portal", targetAction:13, targetName:"Go to Balcony South", H:20, W:45, X:0, Y:72, rotY: .684, startAngle: .9, yTilt:.125}
		]
	},
	9:{//
		name:"Free Weights",
		img:"FREE_WEIGHT_AREA.jpg",
		rotConstraint:[],
		defaultStartAngle:.3,
		targets:[
			//{targetID:0 , targetType:"portal", targetAction:10, targetName:"Go to Lobby", H:22, W:22, X:0, Y:45, rotY: .45, startAngle: .3},
			{targetID:1 , targetType:"portal", targetAction:15, targetName:"Go to Corner Balcony", H:22, W:22, X:0, Y:45, rotY: .61, startAngle: .65},
			{targetID:2 , targetType:"portal", targetAction:13, targetName:"Go to South Balcony", H:20, W:30, X:0, Y:54, rotY: .53, startAngle: .8, yTilt:.035},
			{targetID:3 , targetType:"portal", targetAction:8, targetName:"Go to Raquetball Courts", H:45, W:22, X:0, Y:16, rotY: .667, startAngle: .15, yTilt:.95},
			{targetID:4 , targetType:"portal", targetAction:5, targetName:"Go to Basketball Court", H:49, W:40, X:0, Y:17, rotY: .7, startAngle:.7, yTilt:.11},
			{targetID:0 , targetType:"portal", targetAction:6, targetName:"Go to Fitness Floor", H:45, W:36, X:0, Y:7, rotY: .395, startAngle:.55, yTilt:.9},
			{targetID:5 , targetType:"portal", targetAction:14, targetName:"Go to Balcony West", H:22, W:40, X:0, Y:53, rotY: .358, startAngle:.77, yTilt:.98}
		]
	},
	10:{//
		name:"Lobby",
		img:"LOBBY.jpg",
		rotConstraint:[],
		defaultStartAngle:.5,
		targets:[
			{targetID:0 , targetType:"portal", targetAction:2, targetName:"Go to Cafe", H:110, W:100, X:0, Y:-10, rotY: .786, yTilt:.98},
			{targetID:1 , targetType:"portal", targetAction:14, targetName:"Go to Balcony West", H:90, W:60, X:0, Y:-10, rotY: .252, startAngle:.99, yTilt:.02},
			{targetID:2 , targetType:"portal", targetAction:13, targetName:"Go to Balcony South", H:80, W:40, X:0, Y:0, rotY: .065, startAngle:.616, yTilt:.03}
		]
	},
	11:{//
		name:"Pool",
		img:"POOL.jpg",
		rotConstraint:[],
		defaultStartAngle:.5,
		targets:[
			{targetID:0 , targetType:"portal", targetAction:17, targetName:"Go to Men's Sauna", H:50, W:25, X:0, Y:57, rotY: .085, startAngle:.1},
			{targetID:1 , targetType:"portal", targetAction:19, targetName:"Go to Women's Sauna", H:50, W:25, X:0, Y:57, rotY: .989, startAngle:.4}
		]
	},
	12:{//
		name:"Locker Room Entrance",
		img:"LOCKER_ROOM_EXT.jpg",
		rotConstraint:[],
		defaultStartAngle:.75,
		targets:[
			{targetID:0 , targetType:"portal", targetAction:16, targetName:"Go to Men's Locker Room", H:90, W:45, X:0, Y:10, rotY: .339, startAngle:.17},
			{targetID:1 , targetType:"portal", targetAction:18, targetName:"Go to Women's Locker Room", H:60, W:25, X:0, Y:20, rotY: .677, startAngle:.2},
			{targetID:2 , targetType:"portal", targetAction:7, targetName:"Go to Indoor Track", H:25, W:30, X:0, Y:25, rotY: .165, startAngle:.66, yTilt:.95},
			{targetID:3 , targetType:"portal", targetAction:13, targetName:"Go to South Balcony", H:80, W:60, X:0, Y:-46, rotY: .985, startAngle:.22, xTilt:.2, zTilt:.995},
			{targetID:4 , targetType:"portal", targetAction:8, targetName:"Go to Raquetball Courts", H:75, W:48, X:0, Y:10, rotY: .765, startAngle: .59, yTilt:.17}
		]
	},
	13:{//
		name:"Balcony, South",
		img:"MIDDLE_BALCONY.jpg",
		rotConstraint:[],
		defaultStartAngle:.75,
		targets:[
			{targetID:0 , targetType:"portal", targetAction:10, targetName:"Go to Lobby", H:55, W:40, X:0, Y:55, rotY: .895},
			{targetID:1 , targetType:"portal", targetAction:7, targetName:"Go to Indoor Track", H:24, W:35, X:0, Y:19, rotY: .82, startAngle:.66, yTilt:.95},
			{targetID:2 , targetType:"portal", targetAction:14, targetName:"Go to Balcony West", H:20, W:45, X:0, Y:55, rotY:.725, startAngle:.9, yTilt:.99},
			{targetID:3 , targetType:"portal", targetAction:6, targetName:"Go to Fitness Floor", H:35, W:45, X:0, Y:18, rotY: .68, startAngle: .7, yTilt:.05, xTilt:.02},
			{targetID:4 , targetType:"portal", targetAction:9, targetName:"Go to Free Weights", H:35, W:45, X:0, Y:20, rotY: .57, startAngle:.95, xTilt:.96, yTilt:.03},
			{targetID:5 , targetType:"portal", targetAction:8, targetName:"Go to Raquetball Courts", H:35, W:35, X:0, Y:5, rotY: .49, startAngle: .8, xTilt:.96, yTilt:.95},
			{targetID:6 , targetType:"portal", targetAction:12, targetName:"Go to Locker Room Entrance", H:25, W:50, X:0, Y:33, rotY: .349, startAngle:.5},
			{targetID:7 , targetType:"portal", targetAction:15, targetName:"Go to Corner Balcony", H:110, W:30, X:0, Y:20, xTilt:.16, zTilt:.9, rotY:.2}
		]
	},
	14:{//
		name:"Balcony, West",
		img:"WEST_BALCONY.jpg",
		rotConstraint:[],
		defaultStartAngle:.75,
		targets:[
			{targetID:0 , targetType:"portal", targetAction:10, targetName:"Go to Lobby", H:40, W:35, X:0, Y:61, rotY: .5225},
			{targetID:1 , targetType:"portal", targetAction:15, targetName:"Go to Corner Balcony", H:25, W:30, X:0, Y:58, rotY: .6575, yTilt:.98},
			{targetID:2 , targetType:"portal", targetAction:13, targetName:"Go to South Balcony", H:20, W:30, X:0, Y:63, rotY: .615, yTilt:.97},
			{targetID:3 , targetType:"portal", targetAction:6, targetName:"Go to Fitness Floor", H:50, W:50, X:0, Y:-40, rotY: .78, xTilt:.95},
			{targetID:4 , targetType:"portal", targetAction:8, targetName:"Go to Raquetball Court", H:30, W:40, X:0, Y:35, rotY: .6925, yTilt:.95},
			{targetID:5 , targetType:"portal", targetAction:9, targetName:"Go to Free Weights", H:30, W:20, X:0, Y:10, rotY: .721, startAngle:.19, yTilt:.95},
		]
	},
	15:{//
		name:"Balcony, Corner",
		img:"SOUTH_BALCONY.jpg",
		rotConstraint:[],
		defaultStartAngle:.5,
		targets:[
			{targetID:0 , targetType:"portal", targetAction:4, targetName:"Go to Cycle Studio", H:125, W:100, X:0, Y:10, yTilt:.96, rotY:.31},
			{targetID:1 , targetType:"portal", targetAction:1, targetName:"Go to Aerobics Room", H:73, W:60, X:0, Y:17, rotY:.477},
			{targetID:2 , targetType:"portal", targetAction:13, targetName:"Go to South Balcony", H:70, W:25, X:0, Y:-5, xTilt:.2, zTilt:.12, rotY:.035, startAngle:.25},
			{targetID:3 , targetType:"portal", targetAction:12, targetName:"Go to Locker Room Entrance", H:45, W:30, X:0, Y:-55, yTilt:.06, rotY:.96, startAngle:.5},
			{targetID:4 , targetType:"portal", targetAction:8, targetName:"Go to Raquetball Court", H:40, W:35, X:0, Y:-12, yTilt:.18, rotY: .83},
		]
	},
	16:{//
		name:"Men's Locker Room",
		img:"MEN_LOCKER.jpg",
		rotConstraint:[],
		defaultStartAngle:.5,
		targets:[
			{targetID:0 , targetType:"portal", targetAction:12, targetName:"Go to Locker Room Entrance", H:90, W:45, X:0, Y:25, rotY:.288, startAngle:.1},
			{targetID:1 , targetType:"portal", targetAction:17, targetName:"Go to Men's Sauna", H:80, W:47, X:0, Y:20, rotY:.018, startAngle:.7, yTilt:.05}
		]
	},
	17:{//
		name:"Men's Sauna",
		img:"MEN_SAUNA.jpg",
		rotConstraint:[.66, .13],
		defaultStartAngle:.12,
		targets:[
			{targetID:0 , targetType:"portal", targetAction:16, targetName:"Go to Men's Locker Room", H:80, W:40, X:0, Y:28, rotY:.858, startAngle:.5, yTilt:.95},
			{targetID:1 , targetType:"portal", targetAction:11, targetName:"Go to Pool", H:80, W:40, X:0, Y:20, rotY:.456, yTilt:.95}
		]
	},
	18:{//
		name:"Women's Locker Room",
		img:"WOMEN_LOCKER.jpg",
		rotConstraint:[],
		defaultStartAngle:.2,
		targets:[
			{targetID:0 , targetType:"portal", targetAction:12, targetName:"Go to Locker Room Entrance", H:90, W:50, X:0, Y:25, rotY:.29, startAngle:.8, yTilt:.1},
			{targetID:1 , targetType:"portal", targetAction:19, targetName:"Go to Women's Sauna", H:80, W:47, X:0, Y:20, rotY:.565, startAngle:.85, yTilt:.9}
		]
	},
	19:{//
		name:"Women's Sauna",
		img:"WOMEN_SAUNA.jpg",
		rotConstraint:[.35, .93],
		defaultStartAngle:.36,
		targets:[
			{targetID:0 , targetType:"portal", targetAction:18, targetName:"Go to Women's Locker Room", H:70, W:38, X:0, Y:22, rotY:.651, startAngle:.88, yTilt:.05},
			{targetID:1 , targetType:"portal", targetAction:11, targetName:"Go to Pool", H:80, W:40, X:0, Y:10, rotY:.075, yTilt:.05}
		]
	}
}