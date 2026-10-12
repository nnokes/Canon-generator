{
	"patcher": {
		"fileversion": 1,
		"appversion": {
			"major": 9,
			"minor": 0,
			"revision": 7,
			"architecture": "x64",
			"modernui": 1
		},
		"classnamespace": "box",
		"rect": [
			60.0,
			60.0,
			820.0,
			750.0
		],
		"openinpresentation": 0,
		"default_fontsize": 12.0,
		"default_fontface": 0,
		"default_fontname": "Arial",
		"gridonopen": 1,
		"gridsize": [
			15.0,
			15.0
		],
		"gridsnaponopen": 1,
		"objectsnaponopen": 1,
		"statusbarvisible": 2,
		"toolbarvisible": 1,
		"boxes": [
			{
				"box": {
					"maxclass": "comment",
					"text": "Hand-built: created once by tools/patchgen.py --init. It's yours now: edit it freely in Max; the generator never overwrites it.",
					"numinlets": 1,
					"numoutlets": 0,
					"linecount": 2,
					"patching_rect": [
						20.0,
						10.0,
						780.0,
						42.0
					],
					"id": "obj-1"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "CANONS (M2). Turn audio on (speaker). Pick a preset, then play. The tuning menu plays the same canon in another scale system. The voice editor changes one voice at a time; every change re-renders (stop first if you don't want the change mid-play).",
					"numinlets": 1,
					"numoutlets": 0,
					"linecount": 2,
					"patching_rect": [
						20.0,
						55.0,
						780.0,
						42.0
					],
					"id": "obj-2"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "cg.canon",
					"numinlets": 1,
					"numoutlets": 3,
					"outlettype": [
						"",
						"signal",
						"signal"
					],
					"patching_rect": [
						20.0,
						530.0,
						70.0,
						22.0
					],
					"id": "obj-3"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "preset:",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						20.0,
						100.0,
						55.5,
						20.0
					],
					"id": "obj-4"
				}
			},
			{
				"box": {
					"maxclass": "umenu",
					"numinlets": 1,
					"numoutlets": 3,
					"outlettype": [
						"int",
						"",
						""
					],
					"patching_rect": [
						80.0,
						100.0,
						360.0,
						22.0
					],
					"id": "obj-5"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend preset",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						460.0,
						100.0,
						112.0,
						22.0
					],
					"id": "obj-6"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "tuning:",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						20.0,
						130.0,
						55.5,
						20.0
					],
					"id": "obj-7"
				}
			},
			{
				"box": {
					"maxclass": "umenu",
					"numinlets": 1,
					"numoutlets": 3,
					"outlettype": [
						"int",
						"",
						""
					],
					"patching_rect": [
						80.0,
						130.0,
						360.0,
						22.0
					],
					"id": "obj-8"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend tuning",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						460.0,
						130.0,
						112.0,
						22.0
					],
					"id": "obj-9"
				}
			},
			{
				"box": {
					"maxclass": "message",
					"text": "play",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						20.0,
						165.0,
						44.0,
						22.0
					],
					"id": "obj-10"
				}
			},
			{
				"box": {
					"maxclass": "message",
					"text": "stop",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						70.0,
						165.0,
						44.0,
						22.0
					],
					"id": "obj-11"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "tempo:",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						130.0,
						165.0,
						49.0,
						20.0
					],
					"id": "obj-12"
				}
			},
			{
				"box": {
					"maxclass": "number",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": [
						"",
						"bang"
					],
					"patching_rect": [
						180.0,
						165.0,
						50.0,
						22.0
					],
					"id": "obj-13"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend tempo",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						240.0,
						165.0,
						105.0,
						22.0
					],
					"id": "obj-14"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "volume:",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						360.0,
						165.0,
						55.5,
						20.0
					],
					"id": "obj-15"
				}
			},
			{
				"box": {
					"maxclass": "flonum",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": [
						"",
						"bang"
					],
					"format": 6,
					"patching_rect": [
						420.0,
						165.0,
						50.0,
						22.0
					],
					"id": "obj-16"
				}
			},
			{
				"box": {
					"maxclass": "button",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						"bang"
					],
					"patching_rect": [
						20.0,
						200.0,
						22.0,
						22.0
					],
					"id": "obj-17"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "load a spec...",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						46.0,
						201.0,
						101.0,
						20.0
					],
					"id": "obj-18"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "opendialog",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": [
						"",
						"bang"
					],
					"patching_rect": [
						150.0,
						200.0,
						84.0,
						22.0
					],
					"id": "obj-19"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend loadspec",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						250.0,
						200.0,
						126.0,
						22.0
					],
					"id": "obj-20"
				}
			},
			{
				"box": {
					"maxclass": "button",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						"bang"
					],
					"patching_rect": [
						400.0,
						200.0,
						22.0,
						22.0
					],
					"id": "obj-21"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "save the spec...",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						426.0,
						201.0,
						114.0,
						20.0
					],
					"id": "obj-22"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "savedialog",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": [
						"",
						"bang"
					],
					"patching_rect": [
						545.0,
						200.0,
						84.0,
						22.0
					],
					"id": "obj-23"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend savespec",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						640.0,
						200.0,
						126.0,
						22.0
					],
					"id": "obj-24"
				}
			},
			{
				"box": {
					"maxclass": "button",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						"bang"
					],
					"patching_rect": [
						20.0,
						240.0,
						22.0,
						22.0
					],
					"id": "obj-25"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "load a .mid...",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						46.0,
						241.0,
						101.0,
						20.0
					],
					"id": "obj-26"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "opendialog",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": [
						"",
						"bang"
					],
					"patching_rect": [
						150.0,
						240.0,
						84.0,
						22.0
					],
					"id": "obj-27"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend loadmidi",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						250.0,
						240.0,
						126.0,
						22.0
					],
					"id": "obj-28"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "your melody becomes every canon's dux",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						390.0,
						241.0,
						250.5,
						20.0
					],
					"id": "obj-29"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "line:",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						20.0,
						270.0,
						42.5,
						20.0
					],
					"id": "obj-30"
				}
			},
			{
				"box": {
					"maxclass": "umenu",
					"numinlets": 1,
					"numoutlets": 3,
					"outlettype": [
						"int",
						"",
						""
					],
					"items": [
						"top",
						",",
						"bottom",
						",",
						"track"
					],
					"patching_rect": [
						65.0,
						270.0,
						80.0,
						22.0
					],
					"id": "obj-31"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "map:",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						160.0,
						270.0,
						36.0,
						20.0
					],
					"id": "obj-32"
				}
			},
			{
				"box": {
					"maxclass": "umenu",
					"numinlets": 1,
					"numoutlets": 3,
					"outlettype": [
						"int",
						"",
						""
					],
					"items": [
						"exact",
						",",
						"nearest",
						",",
						"degree"
					],
					"patching_rect": [
						198.0,
						270.0,
						85.0,
						22.0
					],
					"id": "obj-33"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "quantize:",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						295.0,
						270.0,
						68.5,
						20.0
					],
					"id": "obj-34"
				}
			},
			{
				"box": {
					"maxclass": "flonum",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": [
						"",
						"bang"
					],
					"format": 6,
					"patching_rect": [
						366.0,
						270.0,
						50.0,
						22.0
					],
					"id": "obj-35"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "track:",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						425.0,
						270.0,
						49.0,
						20.0
					],
					"id": "obj-36"
				}
			},
			{
				"box": {
					"maxclass": "number",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": [
						"",
						"bang"
					],
					"patching_rect": [
						476.0,
						270.0,
						45.0,
						22.0
					],
					"id": "obj-37"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "(-1 = all)",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						525.0,
						270.0,
						75.0,
						20.0
					],
					"id": "obj-38"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend midiline",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						65.0,
						300.0,
						126.0,
						22.0
					],
					"id": "obj-39"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend midimap",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						198.0,
						300.0,
						119.0,
						22.0
					],
					"id": "obj-40"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend midiquantize",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						320.0,
						300.0,
						154.0,
						22.0
					],
					"id": "obj-41"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend miditrack",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						480.0,
						300.0,
						133.0,
						22.0
					],
					"id": "obj-42"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "VOICE EDITOR (canon voices; free voices are edited in the spec file)",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						20.0,
						335.0,
						452.0,
						20.0
					],
					"id": "obj-43"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "voice",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						20.0,
						358.0,
						42.5,
						20.0
					],
					"id": "obj-44"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "name",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						80.0,
						358.0,
						36.0,
						20.0
					],
					"id": "obj-45"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "delay",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						240.0,
						358.0,
						42.5,
						20.0
					],
					"id": "obj-46"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "interval",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						310.0,
						358.0,
						62.0,
						20.0
					],
					"id": "obj-47"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "transform",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						380.0,
						358.0,
						68.5,
						20.0
					],
					"id": "obj-48"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "time scale",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						460.0,
						358.0,
						75.0,
						20.0
					],
					"id": "obj-49"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "register",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						540.0,
						358.0,
						62.0,
						20.0
					],
					"id": "obj-50"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "passes",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						610.0,
						358.0,
						49.0,
						20.0
					],
					"id": "obj-51"
				}
			},
			{
				"box": {
					"maxclass": "number",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": [
						"",
						"bang"
					],
					"patching_rect": [
						20.0,
						380.0,
						50.0,
						22.0
					],
					"id": "obj-52"
				}
			},
			{
				"box": {
					"maxclass": "message",
					"text": "",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						80.0,
						380.0,
						150.0,
						22.0
					],
					"id": "obj-53"
				}
			},
			{
				"box": {
					"maxclass": "flonum",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": [
						"",
						"bang"
					],
					"format": 6,
					"patching_rect": [
						240.0,
						380.0,
						60.0,
						22.0
					],
					"id": "obj-54"
				}
			},
			{
				"box": {
					"maxclass": "number",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": [
						"",
						"bang"
					],
					"patching_rect": [
						310.0,
						380.0,
						60.0,
						22.0
					],
					"id": "obj-55"
				}
			},
			{
				"box": {
					"maxclass": "umenu",
					"numinlets": 1,
					"numoutlets": 3,
					"outlettype": [
						"int",
						"",
						""
					],
					"items": [
						"P",
						",",
						"I",
						",",
						"R",
						",",
						"RI"
					],
					"patching_rect": [
						380.0,
						380.0,
						70.0,
						22.0
					],
					"id": "obj-56"
				}
			},
			{
				"box": {
					"maxclass": "flonum",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": [
						"",
						"bang"
					],
					"format": 6,
					"patching_rect": [
						460.0,
						380.0,
						70.0,
						22.0
					],
					"id": "obj-57"
				}
			},
			{
				"box": {
					"maxclass": "number",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": [
						"",
						"bang"
					],
					"patching_rect": [
						540.0,
						380.0,
						60.0,
						22.0
					],
					"id": "obj-58"
				}
			},
			{
				"box": {
					"maxclass": "number",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": [
						"",
						"bang"
					],
					"patching_rect": [
						610.0,
						380.0,
						60.0,
						22.0
					],
					"id": "obj-59"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend select",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						20.0,
						415.0,
						112.0,
						22.0
					],
					"id": "obj-60"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend delay",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						240.0,
						415.0,
						105.0,
						22.0
					],
					"id": "obj-61"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend interval",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						310.0,
						440.0,
						126.0,
						22.0
					],
					"id": "obj-62"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend transform",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						380.0,
						415.0,
						133.0,
						22.0
					],
					"id": "obj-63"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend timescale",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						460.0,
						440.0,
						133.0,
						22.0
					],
					"id": "obj-64"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend register",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						540.0,
						415.0,
						126.0,
						22.0
					],
					"id": "obj-65"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend passes",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						610.0,
						440.0,
						112.0,
						22.0
					],
					"id": "obj-66"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "route menu tmenu bpm editor status error",
					"numinlets": 2,
					"numoutlets": 7,
					"outlettype": [
						"",
						"",
						"",
						"",
						"",
						"",
						""
					],
					"patching_rect": [
						20.0,
						570.0,
						294.0,
						22.0
					],
					"id": "obj-67"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend set",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						130.0,
						605.0,
						91.0,
						22.0
					],
					"id": "obj-68"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "unpack i s f i i f i i",
					"numinlets": 1,
					"numoutlets": 8,
					"outlettype": [
						"int",
						"",
						"float",
						"int",
						"int",
						"float",
						"int",
						"int"
					],
					"patching_rect": [
						240.0,
						605.0,
						168.0,
						22.0
					],
					"id": "obj-69"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend set",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						20.0,
						650.0,
						91.0,
						22.0
					],
					"id": "obj-70"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend set",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						80.0,
						675.0,
						91.0,
						22.0
					],
					"id": "obj-71"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend set",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						240.0,
						650.0,
						91.0,
						22.0
					],
					"id": "obj-72"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend set",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						310.0,
						675.0,
						91.0,
						22.0
					],
					"id": "obj-73"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend set",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						380.0,
						650.0,
						91.0,
						22.0
					],
					"id": "obj-74"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend set",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						460.0,
						675.0,
						91.0,
						22.0
					],
					"id": "obj-75"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend set",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						540.0,
						650.0,
						91.0,
						22.0
					],
					"id": "obj-76"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend set",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						610.0,
						675.0,
						91.0,
						22.0
					],
					"id": "obj-77"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "print canon",
					"numinlets": 1,
					"numoutlets": 0,
					"outlettype": [],
					"patching_rect": [
						380.0,
						570.0,
						91.0,
						22.0
					],
					"id": "obj-78"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "print canon-error",
					"numinlets": 1,
					"numoutlets": 0,
					"outlettype": [],
					"patching_rect": [
						480.0,
						570.0,
						133.0,
						22.0
					],
					"id": "obj-79"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "*~ 0.7",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						"signal"
					],
					"patching_rect": [
						600.0,
						530.0,
						56.0,
						22.0
					],
					"id": "obj-80"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "*~ 0.7",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						"signal"
					],
					"patching_rect": [
						660.0,
						530.0,
						56.0,
						22.0
					],
					"id": "obj-81"
				}
			},
			{
				"box": {
					"maxclass": "ezdac~",
					"numinlets": 2,
					"numoutlets": 0,
					"outlettype": [],
					"patching_rect": [
						620.0,
						580.0,
						45.0,
						45.0
					],
					"id": "obj-82"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "loadbang",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						"bang"
					],
					"patching_rect": [
						600.0,
						470.0,
						70.0,
						22.0
					],
					"id": "obj-83"
				}
			},
			{
				"box": {
					"maxclass": "message",
					"text": "0.7",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						600.0,
						500.0,
						37.0,
						22.0
					],
					"id": "obj-84"
				}
			},
			{
				"box": {
					"maxclass": "message",
					"text": "set -1",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						680.0,
						500.0,
						58.0,
						22.0
					],
					"id": "obj-85"
				}
			}
		],
		"lines": [
			{
				"patchline": {
					"source": [
						"obj-5",
						0
					],
					"destination": [
						"obj-6",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-6",
						0
					],
					"destination": [
						"obj-3",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-8",
						0
					],
					"destination": [
						"obj-9",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-9",
						0
					],
					"destination": [
						"obj-3",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-10",
						0
					],
					"destination": [
						"obj-3",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-11",
						0
					],
					"destination": [
						"obj-3",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-13",
						0
					],
					"destination": [
						"obj-14",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-14",
						0
					],
					"destination": [
						"obj-3",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-17",
						0
					],
					"destination": [
						"obj-19",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-19",
						0
					],
					"destination": [
						"obj-20",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-20",
						0
					],
					"destination": [
						"obj-3",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-21",
						0
					],
					"destination": [
						"obj-23",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-23",
						0
					],
					"destination": [
						"obj-24",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-24",
						0
					],
					"destination": [
						"obj-3",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-25",
						0
					],
					"destination": [
						"obj-27",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-27",
						0
					],
					"destination": [
						"obj-28",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-28",
						0
					],
					"destination": [
						"obj-3",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-31",
						0
					],
					"destination": [
						"obj-39",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-39",
						0
					],
					"destination": [
						"obj-3",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-33",
						0
					],
					"destination": [
						"obj-40",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-40",
						0
					],
					"destination": [
						"obj-3",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-35",
						0
					],
					"destination": [
						"obj-41",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-41",
						0
					],
					"destination": [
						"obj-3",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-37",
						0
					],
					"destination": [
						"obj-42",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-42",
						0
					],
					"destination": [
						"obj-3",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-52",
						0
					],
					"destination": [
						"obj-60",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-60",
						0
					],
					"destination": [
						"obj-3",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-54",
						0
					],
					"destination": [
						"obj-61",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-61",
						0
					],
					"destination": [
						"obj-3",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-55",
						0
					],
					"destination": [
						"obj-62",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-62",
						0
					],
					"destination": [
						"obj-3",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-56",
						0
					],
					"destination": [
						"obj-63",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-63",
						0
					],
					"destination": [
						"obj-3",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-57",
						0
					],
					"destination": [
						"obj-64",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-64",
						0
					],
					"destination": [
						"obj-3",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-58",
						0
					],
					"destination": [
						"obj-65",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-65",
						0
					],
					"destination": [
						"obj-3",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-59",
						0
					],
					"destination": [
						"obj-66",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-66",
						0
					],
					"destination": [
						"obj-3",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-3",
						0
					],
					"destination": [
						"obj-67",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-67",
						0
					],
					"destination": [
						"obj-5",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-67",
						1
					],
					"destination": [
						"obj-8",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-67",
						2
					],
					"destination": [
						"obj-68",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-68",
						0
					],
					"destination": [
						"obj-13",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-67",
						3
					],
					"destination": [
						"obj-69",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-69",
						0
					],
					"destination": [
						"obj-70",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-70",
						0
					],
					"destination": [
						"obj-52",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-69",
						1
					],
					"destination": [
						"obj-71",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-71",
						0
					],
					"destination": [
						"obj-53",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-69",
						2
					],
					"destination": [
						"obj-72",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-72",
						0
					],
					"destination": [
						"obj-54",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-69",
						3
					],
					"destination": [
						"obj-73",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-73",
						0
					],
					"destination": [
						"obj-55",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-69",
						4
					],
					"destination": [
						"obj-74",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-74",
						0
					],
					"destination": [
						"obj-56",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-69",
						5
					],
					"destination": [
						"obj-75",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-75",
						0
					],
					"destination": [
						"obj-57",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-69",
						6
					],
					"destination": [
						"obj-76",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-76",
						0
					],
					"destination": [
						"obj-58",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-69",
						7
					],
					"destination": [
						"obj-77",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-77",
						0
					],
					"destination": [
						"obj-59",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-67",
						4
					],
					"destination": [
						"obj-78",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-67",
						5
					],
					"destination": [
						"obj-79",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-3",
						1
					],
					"destination": [
						"obj-80",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-3",
						2
					],
					"destination": [
						"obj-81",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-16",
						0
					],
					"destination": [
						"obj-80",
						1
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-16",
						0
					],
					"destination": [
						"obj-81",
						1
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-80",
						0
					],
					"destination": [
						"obj-82",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-81",
						0
					],
					"destination": [
						"obj-82",
						1
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-83",
						0
					],
					"destination": [
						"obj-84",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-84",
						0
					],
					"destination": [
						"obj-16",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-83",
						0
					],
					"destination": [
						"obj-85",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-85",
						0
					],
					"destination": [
						"obj-37",
						0
					]
				}
			}
		]
	}
}
