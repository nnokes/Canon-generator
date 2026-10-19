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
			40.0,
			40.0,
			1117.0,
			940.0
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
						5.0,
						890.0,
						42.0
					],
					"id": "obj-1"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Pick a preset, turn audio on (the speaker, top right), play. Every edit re-renders at once.",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						20.0,
						48.0,
						601.5,
						20.0
					],
					"id": "obj-2"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "PLAY",
					"numinlets": 1,
					"numoutlets": 0,
					"fontface": 1,
					"patching_rect": [
						20.0,
						70.0,
						56.0,
						20.0
					],
					"id": "obj-3"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "preset",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						20.0,
						100.0,
						49.0,
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
					"id": "obj-5",
					"varname": "presets"
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
						640.0,
						133.0,
						112.0,
						22.0
					],
					"id": "obj-6"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "tuning",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						20.0,
						130.0,
						49.0,
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
					"id": "obj-8",
					"varname": "tunings"
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
						640.0,
						163.0,
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
						160.0,
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
						160.0,
						44.0,
						22.0
					],
					"id": "obj-11"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "tempo",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						130.0,
						160.0,
						42.5,
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
						175.0,
						160.0,
						50.0,
						22.0
					],
					"id": "obj-13",
					"varname": "tempo"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "volume",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						240.0,
						160.0,
						49.0,
						20.0
					],
					"id": "obj-14"
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
						290.0,
						160.0,
						50.0,
						22.0
					],
					"id": "obj-15",
					"varname": "volume"
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
						640.0,
						193.0,
						105.0,
						22.0
					],
					"id": "obj-16"
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
						755.0,
						193.0,
						56.0,
						22.0
					],
					"id": "obj-17"
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
						821.0,
						193.0,
						56.0,
						22.0
					],
					"id": "obj-18"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "output",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						20.0,
						190.0,
						49.0,
						20.0
					],
					"id": "obj-19"
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
						"Hz",
						"voices",
						",",
						"MPE",
						"to",
						"Drift",
						"(inside",
						"Max)",
						",",
						"MPE",
						"to",
						"MIDI",
						"out"
					],
					"patching_rect": [
						80.0,
						190.0,
						230.0,
						22.0
					],
					"id": "obj-20"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend output",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						640.0,
						223.0,
						112.0,
						22.0
					],
					"id": "obj-21"
				}
			},
			{
				"box": {
					"maxclass": "ezdac~",
					"numinlets": 2,
					"numoutlets": 0,
					"outlettype": [],
					"patching_rect": [
						762.0,
						223.0,
						28.0,
						28.0
					],
					"id": "obj-22"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "YOUR MELODY",
					"numinlets": 1,
					"numoutlets": 0,
					"fontface": 1,
					"patching_rect": [
						20.0,
						250.0,
						101.5,
						20.0
					],
					"id": "obj-23"
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
						280.0,
						22.0,
						22.0
					],
					"id": "obj-24"
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
						280.0,
						101.0,
						20.0
					],
					"id": "obj-25"
				}
			},
			{
				"box": {
					"maxclass": "message",
					"text": "presetmelody",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						150.0,
						280.0,
						100.0,
						22.0
					],
					"id": "obj-26"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "back to the preset's own melody",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						255.0,
						280.0,
						211.5,
						20.0
					],
					"id": "obj-27"
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
						640.0,
						313.0,
						84.0,
						22.0
					],
					"id": "obj-28"
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
						640.0,
						343.0,
						126.0,
						22.0
					],
					"id": "obj-29"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "line",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						20.0,
						310.0,
						36.0,
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
						58.0,
						310.0,
						80.0,
						22.0
					],
					"id": "obj-31"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "map",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						148.0,
						310.0,
						30.0,
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
						180.0,
						310.0,
						85.0,
						22.0
					],
					"id": "obj-33"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "quantize",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						275.0,
						310.0,
						62.0,
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
						340.0,
						310.0,
						50.0,
						22.0
					],
					"id": "obj-35"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "track",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						398.0,
						310.0,
						42.5,
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
						443.0,
						310.0,
						45.0,
						22.0
					],
					"id": "obj-37",
					"varname": "track"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "(-1 = all)",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						494.0,
						310.0,
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
						776.0,
						343.0,
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
						912.0,
						343.0,
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
						640.0,
						373.0,
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
						804.0,
						373.0,
						133.0,
						22.0
					],
					"id": "obj-42"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "SPEC FILE",
					"numinlets": 1,
					"numoutlets": 0,
					"fontface": 1,
					"patching_rect": [
						20.0,
						370.0,
						88.5,
						20.0
					],
					"id": "obj-43"
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
						400.0,
						22.0,
						22.0
					],
					"id": "obj-44"
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
						400.0,
						101.0,
						20.0
					],
					"id": "obj-45"
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
						200.0,
						400.0,
						22.0,
						22.0
					],
					"id": "obj-46"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "save the spec...",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						226.0,
						400.0,
						114.0,
						20.0
					],
					"id": "obj-47"
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
						640.0,
						433.0,
						84.0,
						22.0
					],
					"id": "obj-48"
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
						640.0,
						463.0,
						126.0,
						22.0
					],
					"id": "obj-49"
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
						734.0,
						433.0,
						84.0,
						22.0
					],
					"id": "obj-50"
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
						776.0,
						463.0,
						126.0,
						22.0
					],
					"id": "obj-51"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "VOICE EDITOR (canon voices; free voices are edited in the spec file)",
					"numinlets": 1,
					"numoutlets": 0,
					"fontface": 1,
					"patching_rect": [
						20.0,
						460.0,
						472.0,
						20.0
					],
					"id": "obj-52"
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
						520.0,
						45.0,
						22.0
					],
					"id": "obj-53",
					"varname": "voice"
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
						70.0,
						520.0,
						120.0,
						22.0
					],
					"id": "obj-54",
					"varname": "name"
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
						200.0,
						520.0,
						50.0,
						22.0
					],
					"id": "obj-55",
					"varname": "delay"
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
						255.0,
						520.0,
						50.0,
						22.0
					],
					"id": "obj-56",
					"varname": "interval"
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
						325.0,
						520.0,
						65.0,
						22.0
					],
					"id": "obj-57",
					"varname": "transform"
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
						400.0,
						520.0,
						60.0,
						22.0
					],
					"id": "obj-58",
					"varname": "timescale"
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
						480.0,
						520.0,
						50.0,
						22.0
					],
					"id": "obj-59",
					"varname": "register"
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
						550.0,
						520.0,
						45.0,
						22.0
					],
					"id": "obj-60",
					"varname": "passes"
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
						490.0,
						42.5,
						20.0
					],
					"id": "obj-61"
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
						640.0,
						553.0,
						112.0,
						22.0
					],
					"id": "obj-62"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "name",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						70.0,
						490.0,
						36.0,
						20.0
					],
					"id": "obj-63"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "delay",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						200.0,
						490.0,
						42.5,
						20.0
					],
					"id": "obj-64"
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
						762.0,
						553.0,
						105.0,
						22.0
					],
					"id": "obj-65"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "interval",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						255.0,
						490.0,
						62.0,
						20.0
					],
					"id": "obj-66"
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
						877.0,
						553.0,
						126.0,
						22.0
					],
					"id": "obj-67"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "transform",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						325.0,
						490.0,
						68.5,
						20.0
					],
					"id": "obj-68"
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
						640.0,
						583.0,
						133.0,
						22.0
					],
					"id": "obj-69"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "time scale",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						400.0,
						490.0,
						75.0,
						20.0
					],
					"id": "obj-70"
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
						783.0,
						583.0,
						133.0,
						22.0
					],
					"id": "obj-71"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "register",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						480.0,
						490.0,
						62.0,
						20.0
					],
					"id": "obj-72"
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
						926.0,
						583.0,
						126.0,
						22.0
					],
					"id": "obj-73"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "passes",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						550.0,
						490.0,
						49.0,
						20.0
					],
					"id": "obj-74"
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
						640.0,
						613.0,
						112.0,
						22.0
					],
					"id": "obj-75"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "PIANO ROLL",
					"numinlets": 1,
					"numoutlets": 0,
					"fontface": 1,
					"patching_rect": [
						20.0,
						580.0,
						95.0,
						20.0
					],
					"id": "obj-76"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "rules",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						120.0,
						580.0,
						42.5,
						20.0
					],
					"id": "obj-77"
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
						"canon",
						",",
						"florid",
						",",
						"fux-strict",
						",",
						"spectral",
						",",
						"free"
					],
					"patching_rect": [
						165.0,
						580.0,
						110.0,
						22.0
					],
					"id": "obj-78",
					"varname": "rules"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend profile",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						762.0,
						613.0,
						119.0,
						22.0
					],
					"id": "obj-79"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "red = fault, amber = soft; click a marker",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						285.0,
						580.0,
						276.5,
						20.0
					],
					"id": "obj-80"
				}
			},
			{
				"box": {
					"maxclass": "v8ui",
					"filename": "cg.roll.bundle.js",
					"textfile": {
						"filename": "cg.roll.bundle.js",
						"flags": 0,
						"embed": 0,
						"autowatch": 1
					},
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"parameter_enable": 0,
					"patching_rect": [
						20.0,
						610.0,
						580.0,
						260.0
					],
					"id": "obj-81",
					"varname": "roll"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "print roll",
					"numinlets": 1,
					"numoutlets": 0,
					"outlettype": [],
					"patching_rect": [
						640.0,
						883.0,
						84.0,
						22.0
					],
					"id": "obj-82"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "cg.canon",
					"numinlets": 1,
					"numoutlets": 4,
					"outlettype": [
						"",
						"signal",
						"signal",
						"int"
					],
					"patching_rect": [
						640.0,
						643.0,
						70.0,
						22.0
					],
					"id": "obj-83"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "midiout",
					"numinlets": 1,
					"numoutlets": 0,
					"outlettype": [],
					"patching_rect": [
						720.0,
						643.0,
						63.0,
						22.0
					],
					"id": "obj-84"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "route menu tmenu bpm editor rules roll",
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
						640.0,
						673.0,
						280.0,
						22.0
					],
					"id": "obj-85"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend script send presets",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						640.0,
						703.0,
						203.0,
						22.0
					],
					"id": "obj-86"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend script send tunings",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						853.0,
						703.0,
						203.0,
						22.0
					],
					"id": "obj-87"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend script send tempo set",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						640.0,
						733.0,
						217.0,
						22.0
					],
					"id": "obj-88"
				}
			},
			{
				"box": {
					"maxclass": "message",
					"text": "script send voice set $1, script send name set $2, script send delay set $3, script send interval set $4, script send transform set $5, script send timescale set $6, script send register set $7, script send passes set $8",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						640.0,
						763.0,
						420.0,
						64.0
					],
					"id": "obj-89"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend script send rules setsymbol",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						640.0,
						853.0,
						259.0,
						22.0
					],
					"id": "obj-90"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend script send roll",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						734.0,
						883.0,
						182.0,
						22.0
					],
					"id": "obj-91"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "r cg.playhead",
					"numinlets": 0,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						909.0,
						853.0,
						105.0,
						22.0
					],
					"id": "obj-92"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "deferlow",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						926.0,
						883.0,
						70.0,
						22.0
					],
					"id": "obj-93"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend script send roll playhead",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						640.0,
						913.0,
						245.0,
						22.0
					],
					"id": "obj-94"
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
						895.0,
						913.0,
						70.0,
						22.0
					],
					"id": "obj-95"
				}
			},
			{
				"box": {
					"maxclass": "message",
					"text": "script send volume 0.7, script send track set -1, script send rules set 0",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						640.0,
						943.0,
						420.0,
						36.0
					],
					"id": "obj-96"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "thispatcher",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": [
						"",
						""
					],
					"patching_rect": [
						640.0,
						1003.0,
						91.0,
						22.0
					],
					"id": "obj-97"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "route status error melody analysis",
					"numinlets": 2,
					"numoutlets": 5,
					"outlettype": [
						"",
						"",
						"",
						"",
						""
					],
					"patching_rect": [
						741.0,
						1003.0,
						252.0,
						22.0
					],
					"id": "obj-98"
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
						867.0,
						733.0,
						91.0,
						22.0
					],
					"id": "obj-99"
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
						640.0,
						1033.0,
						133.0,
						22.0
					],
					"id": "obj-100"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "print midi_file",
					"numinlets": 1,
					"numoutlets": 0,
					"outlettype": [],
					"patching_rect": [
						783.0,
						1033.0,
						119.0,
						22.0
					],
					"id": "obj-101"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "print analysis",
					"numinlets": 1,
					"numoutlets": 0,
					"outlettype": [],
					"patching_rect": [
						912.0,
						1033.0,
						112.0,
						22.0
					],
					"id": "obj-102"
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Replies set the controls by their scripting names (Inspector: Scripting Name) through [thispatcher]. MIDI out: double-click [midiout] to choose the port (e.g. an IAC bus into a Live MPE instrument); it's saved with this panel.",
					"numinlets": 1,
					"numoutlets": 0,
					"linecount": 4,
					"patching_rect": [
						640.0,
						1063.0,
						420.0,
						70.0
					],
					"id": "obj-103"
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
					],
					"midpoints": [
						83.5,
						124.0,
						643.5,
						124.0
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
					],
					"midpoints": [
						83.5,
						154.0,
						643.5,
						154.0
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
						"obj-16",
						0
					],
					"midpoints": [
						178.5,
						184.0,
						643.5,
						184.0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-15",
						0
					],
					"destination": [
						"obj-17",
						1
					],
					"midpoints": [
						293.5,
						185.0,
						807.5,
						185.0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-15",
						0
					],
					"destination": [
						"obj-18",
						1
					],
					"midpoints": [
						293.5,
						185.0,
						873.5,
						185.0
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
						"obj-21",
						0
					],
					"midpoints": [
						83.5,
						214.0,
						643.5,
						214.0
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
						"obj-22",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-18",
						0
					],
					"destination": [
						"obj-22",
						1
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
						"obj-28",
						0
					],
					"midpoints": [
						23.5,
						304.0,
						643.5,
						304.0
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
						"obj-29",
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
					],
					"midpoints": [
						61.5,
						334.0,
						779.5,
						334.0
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
					],
					"midpoints": [
						183.5,
						335.0,
						915.5,
						335.0
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
					],
					"midpoints": [
						343.5,
						336.0,
						643.5,
						336.0
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
					],
					"midpoints": [
						446.5,
						337.0,
						807.5,
						337.0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-44",
						0
					],
					"destination": [
						"obj-48",
						0
					],
					"midpoints": [
						23.5,
						424.0,
						643.5,
						424.0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-48",
						0
					],
					"destination": [
						"obj-49",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-46",
						0
					],
					"destination": [
						"obj-50",
						0
					],
					"midpoints": [
						203.5,
						425.0,
						737.5,
						425.0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-50",
						0
					],
					"destination": [
						"obj-51",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-53",
						0
					],
					"destination": [
						"obj-62",
						0
					],
					"midpoints": [
						23.5,
						544.0,
						643.5,
						544.0
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
						"obj-65",
						0
					],
					"midpoints": [
						203.5,
						545.0,
						765.5,
						545.0
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
						"obj-67",
						0
					],
					"midpoints": [
						258.5,
						546.0,
						880.5,
						546.0
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
						"obj-69",
						0
					],
					"midpoints": [
						328.5,
						547.0,
						643.5,
						547.0
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
						"obj-71",
						0
					],
					"midpoints": [
						403.5,
						548.0,
						786.5,
						548.0
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
						"obj-73",
						0
					],
					"midpoints": [
						483.5,
						549.0,
						929.5,
						549.0
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
						"obj-75",
						0
					],
					"midpoints": [
						553.5,
						549.0,
						643.5,
						549.0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-78",
						1
					],
					"destination": [
						"obj-79",
						0
					],
					"midpoints": [
						220.0,
						604.0,
						765.5,
						604.0
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
						0
					],
					"midpoints": [
						23.5,
						873.0,
						643.5,
						873.0
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
						"obj-83",
						0
					],
					"midpoints": [
						643.5,
						158.0,
						1075.0,
						158.0,
						1075.0,
						639.0,
						643.5,
						639.0
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
						"obj-83",
						0
					],
					"midpoints": [
						643.5,
						188.0,
						1075.0,
						188.0,
						1075.0,
						639.0,
						643.5,
						639.0
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
						"obj-83",
						0
					],
					"midpoints": [
						23.5,
						186.0,
						1075.0,
						186.0,
						1075.0,
						639.0,
						643.5,
						639.0
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
						"obj-83",
						0
					],
					"midpoints": [
						73.5,
						187.0,
						1075.0,
						187.0,
						1075.0,
						639.0,
						643.5,
						639.0
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
						"obj-83",
						0
					],
					"midpoints": [
						643.5,
						218.0,
						1075.0,
						218.0,
						1075.0,
						639.0,
						643.5,
						639.0
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
						"obj-83",
						0
					],
					"midpoints": [
						643.5,
						248.0,
						1075.0,
						248.0,
						1075.0,
						639.0,
						643.5,
						639.0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-26",
						0
					],
					"destination": [
						"obj-83",
						0
					],
					"midpoints": [
						153.5,
						305.0,
						1075.0,
						305.0,
						1075.0,
						639.0,
						643.5,
						639.0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-29",
						0
					],
					"destination": [
						"obj-83",
						0
					],
					"midpoints": [
						643.5,
						368.0,
						1075.0,
						368.0,
						1075.0,
						639.0,
						643.5,
						639.0
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
						"obj-83",
						0
					],
					"midpoints": [
						779.5,
						368.0,
						1075.0,
						368.0,
						1075.0,
						639.0,
						643.5,
						639.0
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
						"obj-83",
						0
					],
					"midpoints": [
						915.5,
						368.0,
						1075.0,
						368.0,
						1075.0,
						639.0,
						643.5,
						639.0
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
						"obj-83",
						0
					],
					"midpoints": [
						643.5,
						398.0,
						1075.0,
						398.0,
						1075.0,
						639.0,
						643.5,
						639.0
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
						"obj-83",
						0
					],
					"midpoints": [
						807.5,
						398.0,
						1075.0,
						398.0,
						1075.0,
						639.0,
						643.5,
						639.0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-49",
						0
					],
					"destination": [
						"obj-83",
						0
					],
					"midpoints": [
						643.5,
						488.0,
						1075.0,
						488.0,
						1075.0,
						639.0,
						643.5,
						639.0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-51",
						0
					],
					"destination": [
						"obj-83",
						0
					],
					"midpoints": [
						779.5,
						488.0,
						1075.0,
						488.0,
						1075.0,
						639.0,
						643.5,
						639.0
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
						"obj-83",
						0
					],
					"midpoints": [
						643.5,
						578.0,
						1075.0,
						578.0,
						1075.0,
						639.0,
						643.5,
						639.0
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
						"obj-83",
						0
					],
					"midpoints": [
						765.5,
						578.0,
						1075.0,
						578.0,
						1075.0,
						639.0,
						643.5,
						639.0
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
						"obj-83",
						0
					],
					"midpoints": [
						880.5,
						578.0,
						1075.0,
						578.0,
						1075.0,
						639.0,
						643.5,
						639.0
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
						"obj-83",
						0
					],
					"midpoints": [
						643.5,
						608.0,
						1075.0,
						608.0,
						1075.0,
						639.0,
						643.5,
						639.0
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
						"obj-83",
						0
					],
					"midpoints": [
						786.5,
						608.0,
						1075.0,
						608.0,
						1075.0,
						639.0,
						643.5,
						639.0
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
						"obj-83",
						0
					],
					"midpoints": [
						929.5,
						608.0,
						1075.0,
						608.0,
						1075.0,
						639.0,
						643.5,
						639.0
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
						"obj-83",
						0
					],
					"midpoints": [
						643.5,
						638.0,
						1075.0,
						638.0,
						1075.0,
						639.0,
						643.5,
						639.0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-79",
						0
					],
					"destination": [
						"obj-83",
						0
					],
					"midpoints": [
						765.5,
						638.0,
						1075.0,
						638.0,
						1075.0,
						639.0,
						643.5,
						639.0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-83",
						1
					],
					"destination": [
						"obj-17",
						0
					],
					"midpoints": [
						664.5,
						669.0,
						1087.0,
						669.0,
						1087.0,
						190.0,
						758.5,
						190.0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-83",
						2
					],
					"destination": [
						"obj-18",
						0
					],
					"midpoints": [
						685.5,
						670.0,
						1087.0,
						670.0,
						1087.0,
						190.0,
						824.5,
						190.0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-83",
						3
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
						"obj-86",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-85",
						1
					],
					"destination": [
						"obj-87",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-85",
						2
					],
					"destination": [
						"obj-88",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-85",
						3
					],
					"destination": [
						"obj-89",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-85",
						4
					],
					"destination": [
						"obj-90",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-85",
						5
					],
					"destination": [
						"obj-91",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-92",
						0
					],
					"destination": [
						"obj-93",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-93",
						0
					],
					"destination": [
						"obj-94",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-95",
						0
					],
					"destination": [
						"obj-96",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-86",
						0
					],
					"destination": [
						"obj-97",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-87",
						0
					],
					"destination": [
						"obj-97",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-88",
						0
					],
					"destination": [
						"obj-97",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-89",
						0
					],
					"destination": [
						"obj-97",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-90",
						0
					],
					"destination": [
						"obj-97",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-91",
						0
					],
					"destination": [
						"obj-97",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-94",
						0
					],
					"destination": [
						"obj-97",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-96",
						0
					],
					"destination": [
						"obj-97",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-85",
						6
					],
					"destination": [
						"obj-98",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-98",
						0
					],
					"destination": [
						"obj-99",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-98",
						1
					],
					"destination": [
						"obj-100",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-98",
						2
					],
					"destination": [
						"obj-101",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-98",
						3
					],
					"destination": [
						"obj-102",
						0
					]
				}
			}
		]
	}
}
