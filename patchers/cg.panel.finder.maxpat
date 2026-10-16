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
			840.0,
			780.0
		],
		"openinpresentation": 1,
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
					"text": "Answer finder: the canons hidden in a melody",
					"numinlets": 1,
					"numoutlets": 0,
					"fontsize": 16.0,
					"fontface": 1,
					"patching_rect": [
						20.0,
						10.0,
						420.0,
						20.0
					],
					"id": "obj-1",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						10.0,
						420.0,
						20.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Open the canon panel too: the finder searches the melody it plays (a preset's, or your .mid), and plays there the result you click. Clean = no hard faults; cost = soft faults.",
					"numinlets": 1,
					"numoutlets": 0,
					"linecount": 2,
					"patching_rect": [
						20.0,
						40.0,
						760.0,
						42.0
					],
					"id": "obj-2",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						40.0,
						760.0,
						42.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Voices",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						20.0,
						95.0,
						49.0,
						20.0
					],
					"id": "obj-3",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						95.0,
						49.0,
						20.0
					]
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
					"minimum": 2,
					"maximum": 6,
					"patching_rect": [
						220.0,
						95.0,
						50.0,
						22.0
					],
					"id": "obj-4",
					"presentation": 1,
					"presentation_rect": [
						220.0,
						95.0,
						50.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "2 = the melody and one follower. 3 or more = sets of followers that fit together.",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						280.0,
						95.0,
						536.5,
						20.0
					],
					"id": "obj-5",
					"presentation": 1,
					"presentation_rect": [
						280.0,
						95.0,
						536.5,
						20.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Intervals, in scale steps",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						20.0,
						130.0,
						172.5,
						20.0
					],
					"id": "obj-6",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						130.0,
						172.5,
						20.0
					]
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
						220.0,
						130.0,
						50.0,
						22.0
					],
					"id": "obj-7",
					"presentation": 1,
					"presentation_rect": [
						220.0,
						130.0,
						50.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "to",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						275.0,
						130.0,
						30.0,
						20.0
					],
					"id": "obj-8",
					"presentation": 1,
					"presentation_rect": [
						275.0,
						130.0,
						30.0,
						20.0
					]
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
						130.0,
						50.0,
						22.0
					],
					"id": "obj-9",
					"presentation": 1,
					"presentation_rect": [
						310.0,
						130.0,
						50.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "0 = unison, 7 = an octave up, -2 = a third down (in a 7-note scale)",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						368.0,
						130.0,
						445.5,
						20.0
					],
					"id": "obj-10",
					"presentation": 1,
					"presentation_rect": [
						368.0,
						130.0,
						445.5,
						20.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Entry delays, in beats",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						20.0,
						165.0,
						153.0,
						20.0
					],
					"id": "obj-11",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						165.0,
						153.0,
						20.0
					]
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
					"minimum": 0.0,
					"patching_rect": [
						220.0,
						165.0,
						50.0,
						22.0
					],
					"id": "obj-12",
					"presentation": 1,
					"presentation_rect": [
						220.0,
						165.0,
						50.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "to",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						275.0,
						165.0,
						30.0,
						20.0
					],
					"id": "obj-13",
					"presentation": 1,
					"presentation_rect": [
						275.0,
						165.0,
						30.0,
						20.0
					]
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
					"minimum": 0.0,
					"patching_rect": [
						310.0,
						165.0,
						50.0,
						22.0
					],
					"id": "obj-14",
					"presentation": 1,
					"presentation_rect": [
						310.0,
						165.0,
						50.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "every",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						365.0,
						165.0,
						42.5,
						20.0
					],
					"id": "obj-15",
					"presentation": 1,
					"presentation_rect": [
						365.0,
						165.0,
						42.5,
						20.0
					]
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
					"minimum": 0.25,
					"patching_rect": [
						412.0,
						165.0,
						50.0,
						22.0
					],
					"id": "obj-16",
					"presentation": 1,
					"presentation_rect": [
						412.0,
						165.0,
						50.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "how long after the melody each follower comes in",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						470.0,
						165.0,
						322.0,
						20.0
					],
					"id": "obj-17",
					"presentation": 1,
					"presentation_rect": [
						470.0,
						165.0,
						322.0,
						20.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Rules",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						20.0,
						200.0,
						42.5,
						20.0
					],
					"id": "obj-18",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						200.0,
						42.5,
						20.0
					]
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
						220.0,
						200.0,
						130.0,
						22.0
					],
					"id": "obj-19",
					"presentation": 1,
					"presentation_rect": [
						220.0,
						200.0,
						130.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Perpetual canon (it loops)",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						370.0,
						200.0,
						179.0,
						20.0
					],
					"id": "obj-20",
					"presentation": 1,
					"presentation_rect": [
						370.0,
						200.0,
						179.0,
						20.0
					]
				}
			},
			{
				"box": {
					"maxclass": "toggle",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						"int"
					],
					"patching_rect": [
						555.0,
						200.0,
						22.0,
						22.0
					],
					"id": "obj-21",
					"presentation": 1,
					"presentation_rect": [
						555.0,
						200.0,
						22.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Time slice, ms",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						20.0,
						235.0,
						101.0,
						20.0
					],
					"id": "obj-22",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						235.0,
						101.0,
						20.0
					]
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
					"minimum": 1,
					"maximum": 1000,
					"patching_rect": [
						220.0,
						235.0,
						50.0,
						22.0
					],
					"id": "obj-23",
					"presentation": 1,
					"presentation_rect": [
						220.0,
						235.0,
						50.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "bigger = a faster search, a slower screen",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						280.0,
						235.0,
						276.5,
						20.0
					],
					"id": "obj-24",
					"presentation": 1,
					"presentation_rect": [
						280.0,
						235.0,
						276.5,
						20.0
					]
				}
			},
			{
				"box": {
					"maxclass": "message",
					"text": "run",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						560.0,
						235.0,
						37.0,
						22.0
					],
					"id": "obj-25",
					"presentation": 1,
					"presentation_rect": [
						560.0,
						235.0,
						37.0,
						22.0
					]
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
						605.0,
						235.0,
						44.0,
						22.0
					],
					"id": "obj-26",
					"presentation": 1,
					"presentation_rect": [
						605.0,
						235.0,
						44.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Results: click one to hear it in the canon panel",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						20.0,
						275.0,
						322.0,
						20.0
					],
					"id": "obj-27",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						275.0,
						322.0,
						20.0
					]
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
						20.0,
						300.0,
						760.0,
						22.0
					],
					"id": "obj-28",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						300.0,
						760.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Status",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						20.0,
						335.0,
						49.0,
						20.0
					],
					"id": "obj-29",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						335.0,
						49.0,
						20.0
					]
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
						75.0,
						335.0,
						705.0,
						22.0
					],
					"id": "obj-30",
					"presentation": 1,
					"presentation_rect": [
						75.0,
						335.0,
						705.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Hand-built: created once by tools/patchgen.py --init. It's yours now: edit it freely in Max; the generator never overwrites it.",
					"numinlets": 1,
					"numoutlets": 0,
					"linecount": 2,
					"patching_rect": [
						20.0,
						390.0,
						760.0,
						42.0
					],
					"id": "obj-31"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "cg.finder",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						20.0,
						440.0,
						77.0,
						22.0
					],
					"id": "obj-32"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend voices",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						20.0,
						480.0,
						112.0,
						22.0
					],
					"id": "obj-33"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend intervalfrom",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						142.0,
						480.0,
						154.0,
						22.0
					],
					"id": "obj-34"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend intervalto",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						306.0,
						480.0,
						140.0,
						22.0
					],
					"id": "obj-35"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend delayfrom",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						456.0,
						480.0,
						133.0,
						22.0
					],
					"id": "obj-36"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend delayto",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						599.0,
						480.0,
						119.0,
						22.0
					],
					"id": "obj-37"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend delaystep",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						20.0,
						515.0,
						133.0,
						22.0
					],
					"id": "obj-38"
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
						163.0,
						515.0,
						119.0,
						22.0
					],
					"id": "obj-39"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend perpetual",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						292.0,
						515.0,
						133.0,
						22.0
					],
					"id": "obj-40"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend slicems",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						435.0,
						515.0,
						119.0,
						22.0
					],
					"id": "obj-41"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend pick",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						20.0,
						560.0,
						98.0,
						22.0
					],
					"id": "obj-42"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "route results progress error show",
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
						20.0,
						600.0,
						245.0,
						22.0
					],
					"id": "obj-43"
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
						290.0,
						600.0,
						91.0,
						22.0
					],
					"id": "obj-44"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend set error:",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						395.0,
						600.0,
						140.0,
						22.0
					],
					"id": "obj-45"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "print finder",
					"numinlets": 1,
					"numoutlets": 0,
					"outlettype": [],
					"patching_rect": [
						550.0,
						600.0,
						98.0,
						22.0
					],
					"id": "obj-46"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "route voices intervalfrom intervalto delayfrom delayto delaystep profile perpetual slicems",
					"numinlets": 2,
					"numoutlets": 10,
					"outlettype": [
						"",
						"",
						"",
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
						640.0,
						644.0,
						22.0
					],
					"id": "obj-47"
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
						680.0,
						91.0,
						22.0
					],
					"id": "obj-48"
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
						121.0,
						680.0,
						91.0,
						22.0
					],
					"id": "obj-49"
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
						222.0,
						680.0,
						91.0,
						22.0
					],
					"id": "obj-50"
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
						323.0,
						680.0,
						91.0,
						22.0
					],
					"id": "obj-51"
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
						424.0,
						680.0,
						91.0,
						22.0
					],
					"id": "obj-52"
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
						525.0,
						680.0,
						91.0,
						22.0
					],
					"id": "obj-53"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend setsymbol",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						626.0,
						680.0,
						133.0,
						22.0
					],
					"id": "obj-54"
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
						715.0,
						91.0,
						22.0
					],
					"id": "obj-55"
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
						121.0,
						715.0,
						91.0,
						22.0
					],
					"id": "obj-56"
				}
			}
		],
		"lines": [
			{
				"patchline": {
					"source": [
						"obj-25",
						0
					],
					"destination": [
						"obj-32",
						0
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
						"obj-32",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-4",
						0
					],
					"destination": [
						"obj-33",
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
						"obj-32",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-7",
						0
					],
					"destination": [
						"obj-34",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-34",
						0
					],
					"destination": [
						"obj-32",
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
						"obj-35",
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
						"obj-32",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-12",
						0
					],
					"destination": [
						"obj-36",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-36",
						0
					],
					"destination": [
						"obj-32",
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
						"obj-37",
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
						"obj-32",
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
						"obj-38",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-38",
						0
					],
					"destination": [
						"obj-32",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-19",
						1
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
						"obj-32",
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
						"obj-32",
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
						"obj-32",
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
						"obj-32",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-32",
						0
					],
					"destination": [
						"obj-43",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-43",
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
						"obj-43",
						1
					],
					"destination": [
						"obj-44",
						0
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
						"obj-30",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-43",
						2
					],
					"destination": [
						"obj-45",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-45",
						0
					],
					"destination": [
						"obj-30",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-43",
						2
					],
					"destination": [
						"obj-46",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-43",
						4
					],
					"destination": [
						"obj-46",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-43",
						3
					],
					"destination": [
						"obj-47",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-47",
						0
					],
					"destination": [
						"obj-48",
						0
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
						"obj-4",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-47",
						1
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
						"obj-49",
						0
					],
					"destination": [
						"obj-7",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-47",
						2
					],
					"destination": [
						"obj-50",
						0
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
						"obj-9",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-47",
						3
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
						"obj-51",
						0
					],
					"destination": [
						"obj-12",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-47",
						4
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
						"obj-52",
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
						"obj-47",
						5
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
						"obj-53",
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
						"obj-47",
						6
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
						"obj-54",
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
						"obj-47",
						7
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
						"obj-55",
						0
					],
					"destination": [
						"obj-21",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-47",
						8
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
						"obj-56",
						0
					],
					"destination": [
						"obj-23",
						0
					]
				}
			}
		]
	}
}
