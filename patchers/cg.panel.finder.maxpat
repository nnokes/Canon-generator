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
			40.0,
			1360.0,
			1081.0
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
					"text": "Answer finder: canons hidden in the canon panel's melody",
					"numinlets": 1,
					"numoutlets": 0,
					"fontsize": 16.0,
					"fontface": 1,
					"patching_rect": [
						20.0,
						10.0,
						600.0,
						20.0
					],
					"id": "obj-1",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						10.0,
						600.0,
						20.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Searches the melody the canon panel plays (a preset's, or your .mid) for the canons hidden in it, and plays there the result you click. How to read the results: at the bottom.",
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
					"maxclass": "panel",
					"numinlets": 1,
					"numoutlets": 0,
					"outlettype": [],
					"bgcolor": [
						0.6,
						0.6,
						0.6,
						1.0
					],
					"bgfillcolor_type": "color",
					"bgfillcolor_color": [
						0.6,
						0.6,
						0.6,
						1.0
					],
					"border": 0,
					"patching_rect": [
						830.0,
						10.0,
						2.0,
						1041.0
					],
					"id": "obj-3",
					"presentation": 1,
					"presentation_rect": [
						830.0,
						10.0,
						2.0,
						1041.0
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
						55.0,
						20.0
					],
					"id": "obj-4",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						95.0,
						55.0,
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
					"id": "obj-5",
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
					"text": "2 = the melody and one follower; 3+ = sets that fit together",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						280.0,
						95.0,
						460.0,
						20.0
					],
					"id": "obj-6",
					"presentation": 1,
					"presentation_rect": [
						280.0,
						95.0,
						460.0,
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
						197.5,
						20.0
					],
					"id": "obj-7",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						130.0,
						197.5,
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
					"id": "obj-8",
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
					"id": "obj-9",
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
					"id": "obj-10",
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
					"text": "0 unison, 7 octave up, -2 third down (7-note scale)",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						368.0,
						130.0,
						392.5,
						20.0
					],
					"id": "obj-11",
					"presentation": 1,
					"presentation_rect": [
						368.0,
						130.0,
						392.5,
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
						175.0,
						20.0
					],
					"id": "obj-12",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						165.0,
						175.0,
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
					"id": "obj-13",
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
					"id": "obj-14",
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
					"id": "obj-15",
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
						363.0,
						165.0,
						47.5,
						20.0
					],
					"id": "obj-16",
					"presentation": 1,
					"presentation_rect": [
						363.0,
						165.0,
						47.5,
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
					"id": "obj-17",
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
					"text": "0 = with the melody; every = the step",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						470.0,
						165.0,
						287.5,
						20.0
					],
					"id": "obj-18",
					"presentation": 1,
					"presentation_rect": [
						470.0,
						165.0,
						287.5,
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
						47.5,
						20.0
					],
					"id": "obj-19",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						200.0,
						47.5,
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
					"id": "obj-20",
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
					"text": "Perpetual (it loops)",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						370.0,
						200.0,
						160.0,
						20.0
					],
					"id": "obj-21",
					"presentation": 1,
					"presentation_rect": [
						370.0,
						200.0,
						160.0,
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
					"id": "obj-22",
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
					"text": "Transforms",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						20.0,
						235.0,
						85.0,
						20.0
					],
					"id": "obj-23",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						235.0,
						85.0,
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
						220.0,
						235.0,
						22.0,
						22.0
					],
					"id": "obj-24",
					"presentation": 1,
					"presentation_rect": [
						220.0,
						235.0,
						22.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "P",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						245.0,
						235.0,
						30.0,
						20.0
					],
					"id": "obj-25",
					"presentation": 1,
					"presentation_rect": [
						245.0,
						235.0,
						30.0,
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
						280.0,
						235.0,
						22.0,
						22.0
					],
					"id": "obj-26",
					"presentation": 1,
					"presentation_rect": [
						280.0,
						235.0,
						22.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "I",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						305.0,
						235.0,
						30.0,
						20.0
					],
					"id": "obj-27",
					"presentation": 1,
					"presentation_rect": [
						305.0,
						235.0,
						30.0,
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
						340.0,
						235.0,
						22.0,
						22.0
					],
					"id": "obj-28",
					"presentation": 1,
					"presentation_rect": [
						340.0,
						235.0,
						22.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "R",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						365.0,
						235.0,
						30.0,
						20.0
					],
					"id": "obj-29",
					"presentation": 1,
					"presentation_rect": [
						365.0,
						235.0,
						30.0,
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
						400.0,
						235.0,
						22.0,
						22.0
					],
					"id": "obj-30",
					"presentation": 1,
					"presentation_rect": [
						400.0,
						235.0,
						22.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "RI",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						425.0,
						235.0,
						30.0,
						20.0
					],
					"id": "obj-31",
					"presentation": 1,
					"presentation_rect": [
						425.0,
						235.0,
						30.0,
						20.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Time scales",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						470.0,
						235.0,
						92.5,
						20.0
					],
					"id": "obj-32",
					"presentation": 1,
					"presentation_rect": [
						470.0,
						235.0,
						92.5,
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
						565.0,
						235.0,
						22.0,
						22.0
					],
					"id": "obj-33",
					"presentation": 1,
					"presentation_rect": [
						565.0,
						235.0,
						22.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "x0.5",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						590.0,
						235.0,
						40.0,
						20.0
					],
					"id": "obj-34",
					"presentation": 1,
					"presentation_rect": [
						590.0,
						235.0,
						40.0,
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
						630.0,
						235.0,
						22.0,
						22.0
					],
					"id": "obj-35",
					"presentation": 1,
					"presentation_rect": [
						630.0,
						235.0,
						22.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "x1",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						655.0,
						235.0,
						30.0,
						20.0
					],
					"id": "obj-36",
					"presentation": 1,
					"presentation_rect": [
						655.0,
						235.0,
						30.0,
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
						695.0,
						235.0,
						22.0,
						22.0
					],
					"id": "obj-37",
					"presentation": 1,
					"presentation_rect": [
						695.0,
						235.0,
						22.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "x2",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						720.0,
						235.0,
						30.0,
						20.0
					],
					"id": "obj-38",
					"presentation": 1,
					"presentation_rect": [
						720.0,
						235.0,
						30.0,
						20.0
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
						270.0,
						115.0,
						20.0
					],
					"id": "obj-39",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						270.0,
						115.0,
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
						270.0,
						50.0,
						22.0
					],
					"id": "obj-40",
					"presentation": 1,
					"presentation_rect": [
						220.0,
						270.0,
						50.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "smaller = smoother, bigger = sooner",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						280.0,
						270.0,
						272.5,
						20.0
					],
					"id": "obj-41",
					"presentation": 1,
					"presentation_rect": [
						280.0,
						270.0,
						272.5,
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
						270.0,
						37.0,
						22.0
					],
					"id": "obj-42",
					"presentation": 1,
					"presentation_rect": [
						560.0,
						270.0,
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
						270.0,
						44.0,
						22.0
					],
					"id": "obj-43",
					"presentation": 1,
					"presentation_rect": [
						605.0,
						270.0,
						44.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "stops the search",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						655.0,
						270.0,
						130.0,
						20.0
					],
					"id": "obj-44",
					"presentation": 1,
					"presentation_rect": [
						655.0,
						270.0,
						130.0,
						20.0
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
						310.0,
						370.0,
						20.0
					],
					"id": "obj-45",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						310.0,
						370.0,
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
						335.0,
						760.0,
						22.0
					],
					"id": "obj-46",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						335.0,
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
						370.0,
						55.0,
						20.0
					],
					"id": "obj-47",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						370.0,
						55.0,
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
						370.0,
						705.0,
						22.0
					],
					"id": "obj-48",
					"presentation": 1,
					"presentation_rect": [
						75.0,
						370.0,
						705.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "How to read it",
					"numinlets": 1,
					"numoutlets": 0,
					"fontface": 1,
					"patching_rect": [
						20.0,
						410.0,
						115.0,
						20.0
					],
					"id": "obj-49",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						410.0,
						115.0,
						20.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "A result reads like  3. lower 3rd / after 4: 1 fault / cost 1  (from the round). The 3. is its rank: fewest faults first, then the lowest cost. lower 3rd / after 4 is the follower: a 3rd below the melody, coming in 4 beats after it. With 3 or more voices, + joins the followers.",
					"numinlets": 1,
					"numoutlets": 0,
					"linecount": 5,
					"patching_rect": [
						20.0,
						435.0,
						760.0,
						84.0
					],
					"id": "obj-50",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						435.0,
						760.0,
						84.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "clean: it breaks no hard rule. A fault is one hard-rule break: parallel fifths or octaves, or a dissonance that isn't a passing note or a suspension.",
					"numinlets": 1,
					"numoutlets": 0,
					"linecount": 3,
					"patching_rect": [
						20.0,
						525.0,
						760.0,
						56.0
					],
					"id": "obj-51",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						525.0,
						760.0,
						56.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "cost: the soft rules, added up. Each break adds its weight: a hidden fifth or octave 1, a leap beyond a fifth 0.5, a voice coming back after less than a beat of rest 0.5. Lower is smoother; no cost shown = 0. Every rule and weight: docs/controls.md",
					"numinlets": 1,
					"numoutlets": 0,
					"linecount": 4,
					"patching_rect": [
						20.0,
						587.0,
						760.0,
						70.0
					],
					"id": "obj-52",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						587.0,
						760.0,
						70.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Transforms: P = the melody as is, I = upside down, R = backwards, RI = both. Time scales: x2 = the follower at half speed (augmentation, as in a prolation canon), x0.5 = twice as fast. Each tick multiplies the search. In a result, I, R, RI or x2 marks a follower's transform or speed.",
					"numinlets": 1,
					"numoutlets": 0,
					"linecount": 5,
					"patching_rect": [
						20.0,
						663.0,
						760.0,
						84.0
					],
					"id": "obj-53",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						663.0,
						760.0,
						84.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Status: done: 3 clean of 152 = 152 followers tried, 3 without faults. With 3 or more voices the finder tries each follower against the melody alone (pass alone), pairs the ones that pass (fit together), makes sets only of pairs that fit, and judges each set whole. stopped at the budget (in the Max window) = 20000 canons tried: narrow the ranges. No sets: the line says why.",
					"numinlets": 1,
					"numoutlets": 0,
					"linecount": 6,
					"patching_rect": [
						20.0,
						753.0,
						760.0,
						98.0
					],
					"id": "obj-54",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						753.0,
						760.0,
						98.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Rules: canon = Albrechtsberger's florid canon rules (the default). florid = the same without the two canon rules (a beat's rest before a voice comes back; no phrase starting a 7th or 9th from the last). fux-strict = note against note: strict, few results. spectral = no hard rules; the cost comes from roughness and parallels. free = no rules: everything is clean. Perpetual: every voice loops, so where the melody wraps around is judged too.",
					"numinlets": 1,
					"numoutlets": 0,
					"linecount": 7,
					"patching_rect": [
						20.0,
						857.0,
						760.0,
						112.0
					],
					"id": "obj-55",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						857.0,
						760.0,
						112.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Time slice: the search runs in pieces. The finder works this many ms, lets Max redraw and take clicks, then carries on. Smaller = smoother; bigger = finishes sooner. 20 ms is about one screen refresh.",
					"numinlets": 1,
					"numoutlets": 0,
					"linecount": 4,
					"patching_rect": [
						20.0,
						975.0,
						760.0,
						70.0
					],
					"id": "obj-56",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						975.0,
						760.0,
						70.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Generate: new melodies, written as canons",
					"numinlets": 1,
					"numoutlets": 0,
					"fontsize": 16.0,
					"fontface": 1,
					"patching_rect": [
						840.0,
						10.0,
						460.0,
						20.0
					],
					"id": "obj-57",
					"presentation": 1,
					"presentation_rect": [
						840.0,
						10.0,
						460.0,
						20.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Writes a new melody and its canon (Fux, first species). It doesn't read the canon panel's melody: a click plays the canon there.",
					"numinlets": 1,
					"numoutlets": 0,
					"linecount": 2,
					"patching_rect": [
						840.0,
						40.0,
						460.0,
						42.0
					],
					"id": "obj-58",
					"presentation": 1,
					"presentation_rect": [
						840.0,
						40.0,
						460.0,
						42.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Mode",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						840.0,
						95.0,
						40.0,
						20.0
					],
					"id": "obj-59",
					"presentation": 1,
					"presentation_rect": [
						840.0,
						95.0,
						40.0,
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
						"ionian",
						",",
						"dorian",
						",",
						"phrygian",
						",",
						"lydian",
						",",
						"mixolydian",
						",",
						"aeolian",
						",",
						"panel"
					],
					"patching_rect": [
						1000.0,
						95.0,
						110.0,
						22.0
					],
					"id": "obj-60",
					"presentation": 1,
					"presentation_rect": [
						1000.0,
						95.0,
						110.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "panel = canon panel's tuning",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						1118.0,
						95.0,
						220.0,
						20.0
					],
					"id": "obj-61",
					"presentation": 1,
					"presentation_rect": [
						1118.0,
						95.0,
						220.0,
						20.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Notes in the melody",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						840.0,
						130.0,
						152.5,
						20.0
					],
					"id": "obj-62",
					"presentation": 1,
					"presentation_rect": [
						840.0,
						130.0,
						152.5,
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
					"maximum": 64,
					"patching_rect": [
						1000.0,
						130.0,
						50.0,
						22.0
					],
					"id": "obj-63",
					"presentation": 1,
					"presentation_rect": [
						1000.0,
						130.0,
						50.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "one per bar",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						1055.0,
						130.0,
						92.5,
						20.0
					],
					"id": "obj-64",
					"presentation": 1,
					"presentation_rect": [
						1055.0,
						130.0,
						92.5,
						20.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Range below / above",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						840.0,
						165.0,
						152.5,
						20.0
					],
					"id": "obj-65",
					"presentation": 1,
					"presentation_rect": [
						840.0,
						165.0,
						152.5,
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
					"minimum": 0,
					"maximum": 14,
					"patching_rect": [
						1000.0,
						165.0,
						50.0,
						22.0
					],
					"id": "obj-66",
					"presentation": 1,
					"presentation_rect": [
						1000.0,
						165.0,
						50.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "/",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						1055.0,
						165.0,
						30.0,
						20.0
					],
					"id": "obj-67",
					"presentation": 1,
					"presentation_rect": [
						1055.0,
						165.0,
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
					"minimum": 0,
					"maximum": 21,
					"patching_rect": [
						1090.0,
						165.0,
						50.0,
						22.0
					],
					"id": "obj-68",
					"presentation": 1,
					"presentation_rect": [
						1090.0,
						165.0,
						50.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "steps from the final",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						1145.0,
						165.0,
						160.0,
						20.0
					],
					"id": "obj-69",
					"presentation": 1,
					"presentation_rect": [
						1145.0,
						165.0,
						160.0,
						20.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Follower",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						840.0,
						200.0,
						70.0,
						20.0
					],
					"id": "obj-70",
					"presentation": 1,
					"presentation_rect": [
						840.0,
						200.0,
						70.0,
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
					"minimum": -21,
					"maximum": 21,
					"patching_rect": [
						1000.0,
						200.0,
						50.0,
						22.0
					],
					"id": "obj-71",
					"presentation": 1,
					"presentation_rect": [
						1000.0,
						200.0,
						50.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "steps, after",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						1055.0,
						200.0,
						100.0,
						20.0
					],
					"id": "obj-72",
					"presentation": 1,
					"presentation_rect": [
						1055.0,
						200.0,
						100.0,
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
					"minimum": 0,
					"maximum": 16,
					"patching_rect": [
						1160.0,
						200.0,
						50.0,
						22.0
					],
					"id": "obj-73",
					"presentation": 1,
					"presentation_rect": [
						1160.0,
						200.0,
						50.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "bars",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						1215.0,
						200.0,
						40.0,
						20.0
					],
					"id": "obj-74",
					"presentation": 1,
					"presentation_rect": [
						1215.0,
						200.0,
						40.0,
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
						840.0,
						235.0,
						47.5,
						20.0
					],
					"id": "obj-75",
					"presentation": 1,
					"presentation_rect": [
						840.0,
						235.0,
						47.5,
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
						"fux-strict",
						",",
						"canon",
						",",
						"florid",
						",",
						"spectral",
						",",
						"free"
					],
					"patching_rect": [
						1000.0,
						235.0,
						110.0,
						22.0
					],
					"id": "obj-76",
					"presentation": 1,
					"presentation_rect": [
						1000.0,
						235.0,
						110.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "close",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						1120.0,
						235.0,
						47.5,
						20.0
					],
					"id": "obj-77",
					"presentation": 1,
					"presentation_rect": [
						1120.0,
						235.0,
						47.5,
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
						"6|8",
						",",
						"3|1"
					],
					"patching_rect": [
						1170.0,
						235.0,
						60.0,
						22.0
					],
					"id": "obj-78",
					"presentation": 1,
					"presentation_rect": [
						1170.0,
						235.0,
						60.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Seed",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						840.0,
						270.0,
						40.0,
						20.0
					],
					"id": "obj-79",
					"presentation": 1,
					"presentation_rect": [
						840.0,
						270.0,
						40.0,
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
						1000.0,
						270.0,
						50.0,
						22.0
					],
					"id": "obj-80",
					"presentation": 1,
					"presentation_rect": [
						1000.0,
						270.0,
						50.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "canons",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						1055.0,
						270.0,
						55.0,
						20.0
					],
					"id": "obj-81",
					"presentation": 1,
					"presentation_rect": [
						1055.0,
						270.0,
						55.0,
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
					"maximum": 32,
					"patching_rect": [
						1112.0,
						270.0,
						50.0,
						22.0
					],
					"id": "obj-82",
					"presentation": 1,
					"presentation_rect": [
						1112.0,
						270.0,
						50.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "taste",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						1166.0,
						270.0,
						47.5,
						20.0
					],
					"id": "obj-83",
					"presentation": 1,
					"presentation_rect": [
						1166.0,
						270.0,
						47.5,
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
						1216.0,
						270.0,
						22.0,
						22.0
					],
					"id": "obj-84",
					"presentation": 1,
					"presentation_rect": [
						1216.0,
						270.0,
						22.0,
						22.0
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
						1244.0,
						270.0,
						37.0,
						22.0
					],
					"id": "obj-85",
					"presentation": 1,
					"presentation_rect": [
						1244.0,
						270.0,
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
						1286.0,
						270.0,
						44.0,
						22.0
					],
					"id": "obj-86",
					"presentation": 1,
					"presentation_rect": [
						1286.0,
						270.0,
						44.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Canons: click one to hear it in the canon panel",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						840.0,
						310.0,
						362.5,
						20.0
					],
					"id": "obj-87",
					"presentation": 1,
					"presentation_rect": [
						840.0,
						310.0,
						362.5,
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
						840.0,
						335.0,
						460.0,
						22.0
					],
					"id": "obj-88",
					"presentation": 1,
					"presentation_rect": [
						840.0,
						335.0,
						460.0,
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
						840.0,
						370.0,
						55.0,
						20.0
					],
					"id": "obj-89",
					"presentation": 1,
					"presentation_rect": [
						840.0,
						370.0,
						55.0,
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
						895.0,
						370.0,
						405.0,
						22.0
					],
					"id": "obj-90",
					"presentation": 1,
					"presentation_rect": [
						895.0,
						370.0,
						405.0,
						22.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "How to read it",
					"numinlets": 1,
					"numoutlets": 0,
					"fontface": 1,
					"patching_rect": [
						840.0,
						410.0,
						115.0,
						20.0
					],
					"id": "obj-91",
					"presentation": 1,
					"presentation_rect": [
						840.0,
						410.0,
						115.0,
						20.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "A canon reads like  2. seed 3: C5 B4 D5 C5 ... / cost 1.5  : its seed, then the melody's first notes. A seed is a canon: the same settings and seed give the same canon. Canons = how many seeds to try, from the seed up.",
					"numinlets": 1,
					"numoutlets": 0,
					"linecount": 6,
					"patching_rect": [
						840.0,
						435.0,
						460.0,
						98.0
					],
					"id": "obj-92",
					"presentation": 1,
					"presentation_rect": [
						840.0,
						435.0,
						460.0,
						98.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Every canon here passes the hard rules. cost: the soft rules, added up (lower is smoother). Taste (ours, not Fux's) steers the melody toward steps, away from leaps, repeats and rocking between two notes.",
					"numinlets": 1,
					"numoutlets": 0,
					"linecount": 5,
					"patching_rect": [
						840.0,
						539.0,
						460.0,
						84.0
					],
					"id": "obj-93",
					"presentation": 1,
					"presentation_rect": [
						840.0,
						539.0,
						460.0,
						84.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "A click replaces what the canon panel plays; your .mid stays loaded (presetmelody or a preset brings it back). The finder, on the left, searches that melody, not these.",
					"numinlets": 1,
					"numoutlets": 0,
					"linecount": 5,
					"patching_rect": [
						840.0,
						629.0,
						460.0,
						84.0
					],
					"id": "obj-94",
					"presentation": 1,
					"presentation_rect": [
						840.0,
						629.0,
						460.0,
						84.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "None found: the status line names the rule that blocked it (or the budget). Try another interval, delay or range. The octave a bar later can only move by leaps: a step would make a 7th or 9th.",
					"numinlets": 1,
					"numoutlets": 0,
					"linecount": 5,
					"patching_rect": [
						840.0,
						719.0,
						460.0,
						84.0
					],
					"id": "obj-95",
					"presentation": 1,
					"presentation_rect": [
						840.0,
						719.0,
						460.0,
						84.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "The close: 6|8, a major sixth opening to the octave, or 3|1, a minor third closing to the unison (Fux), with the leading note raised where the mode needs it (C sharp in D dorian) and reached by step.",
					"numinlets": 1,
					"numoutlets": 0,
					"linecount": 5,
					"patching_rect": [
						840.0,
						809.0,
						460.0,
						84.0
					],
					"id": "obj-96",
					"presentation": 1,
					"presentation_rect": [
						840.0,
						809.0,
						460.0,
						84.0
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
						1071.0,
						760.0,
						42.0
					],
					"id": "obj-97"
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
						1121.0,
						77.0,
						22.0
					],
					"id": "obj-98"
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
						1161.0,
						112.0,
						22.0
					],
					"id": "obj-99"
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
						1161.0,
						154.0,
						22.0
					],
					"id": "obj-100"
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
						1161.0,
						140.0,
						22.0
					],
					"id": "obj-101"
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
						1161.0,
						133.0,
						22.0
					],
					"id": "obj-102"
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
						1161.0,
						119.0,
						22.0
					],
					"id": "obj-103"
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
						1196.0,
						133.0,
						22.0
					],
					"id": "obj-104"
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
						1196.0,
						119.0,
						22.0
					],
					"id": "obj-105"
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
						1196.0,
						133.0,
						22.0
					],
					"id": "obj-106"
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
						1196.0,
						119.0,
						22.0
					],
					"id": "obj-107"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend transform P",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						564.0,
						1196.0,
						147.0,
						22.0
					],
					"id": "obj-108"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend transform I",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						20.0,
						1231.0,
						147.0,
						22.0
					],
					"id": "obj-109"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend transform R",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						177.0,
						1231.0,
						147.0,
						22.0
					],
					"id": "obj-110"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend transform RI",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						334.0,
						1231.0,
						154.0,
						22.0
					],
					"id": "obj-111"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend timescale 0.5",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						498.0,
						1231.0,
						161.0,
						22.0
					],
					"id": "obj-112"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend timescale 1",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						20.0,
						1266.0,
						147.0,
						22.0
					],
					"id": "obj-113"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend timescale 2",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						177.0,
						1266.0,
						147.0,
						22.0
					],
					"id": "obj-114"
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
						1311.0,
						98.0,
						22.0
					],
					"id": "obj-115"
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
						1351.0,
						245.0,
						22.0
					],
					"id": "obj-116"
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
						1351.0,
						91.0,
						22.0
					],
					"id": "obj-117"
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
						1351.0,
						140.0,
						22.0
					],
					"id": "obj-118"
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
						1351.0,
						98.0,
						22.0
					],
					"id": "obj-119"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "route voices intervalfrom intervalto delayfrom delayto delaystep profile perpetual slicems transforms timescales",
					"numinlets": 2,
					"numoutlets": 12,
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
						"",
						"",
						""
					],
					"patching_rect": [
						20.0,
						1391.0,
						798.0,
						22.0
					],
					"id": "obj-120"
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
						1431.0,
						91.0,
						22.0
					],
					"id": "obj-121"
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
						1431.0,
						91.0,
						22.0
					],
					"id": "obj-122"
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
						1431.0,
						91.0,
						22.0
					],
					"id": "obj-123"
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
						1431.0,
						91.0,
						22.0
					],
					"id": "obj-124"
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
						1431.0,
						91.0,
						22.0
					],
					"id": "obj-125"
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
						1431.0,
						91.0,
						22.0
					],
					"id": "obj-126"
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
						1431.0,
						133.0,
						22.0
					],
					"id": "obj-127"
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
						1466.0,
						91.0,
						22.0
					],
					"id": "obj-128"
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
						1466.0,
						91.0,
						22.0
					],
					"id": "obj-129"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "unpack 0 0 0 0",
					"numinlets": 1,
					"numoutlets": 4,
					"outlettype": [
						"",
						"",
						"",
						""
					],
					"patching_rect": [
						222.0,
						1466.0,
						112.0,
						22.0
					],
					"id": "obj-130"
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
						344.0,
						1466.0,
						91.0,
						22.0
					],
					"id": "obj-131"
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
						445.0,
						1466.0,
						91.0,
						22.0
					],
					"id": "obj-132"
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
						546.0,
						1466.0,
						91.0,
						22.0
					],
					"id": "obj-133"
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
						647.0,
						1466.0,
						91.0,
						22.0
					],
					"id": "obj-134"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "unpack 0 0 0",
					"numinlets": 1,
					"numoutlets": 3,
					"outlettype": [
						"",
						"",
						""
					],
					"patching_rect": [
						20.0,
						1501.0,
						98.0,
						22.0
					],
					"id": "obj-135"
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
						128.0,
						1501.0,
						91.0,
						22.0
					],
					"id": "obj-136"
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
						229.0,
						1501.0,
						91.0,
						22.0
					],
					"id": "obj-137"
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
						330.0,
						1501.0,
						91.0,
						22.0
					],
					"id": "obj-138"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "cg.generate",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						20.0,
						1561.0,
						91.0,
						22.0
					],
					"id": "obj-139"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend mode",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						20.0,
						1601.0,
						98.0,
						22.0
					],
					"id": "obj-140"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend notes",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						128.0,
						1601.0,
						105.0,
						22.0
					],
					"id": "obj-141"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend below",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						243.0,
						1601.0,
						105.0,
						22.0
					],
					"id": "obj-142"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend above",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						358.0,
						1601.0,
						105.0,
						22.0
					],
					"id": "obj-143"
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
						473.0,
						1601.0,
						126.0,
						22.0
					],
					"id": "obj-144"
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
						609.0,
						1601.0,
						105.0,
						22.0
					],
					"id": "obj-145"
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
						20.0,
						1636.0,
						119.0,
						22.0
					],
					"id": "obj-146"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend cadence",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						149.0,
						1636.0,
						119.0,
						22.0
					],
					"id": "obj-147"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend seed",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						278.0,
						1636.0,
						98.0,
						22.0
					],
					"id": "obj-148"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend count",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						386.0,
						1636.0,
						105.0,
						22.0
					],
					"id": "obj-149"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "prepend taste",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						501.0,
						1636.0,
						105.0,
						22.0
					],
					"id": "obj-150"
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
						616.0,
						1636.0,
						98.0,
						22.0
					],
					"id": "obj-151"
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
						1681.0,
						245.0,
						22.0
					],
					"id": "obj-152"
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
						275.0,
						1681.0,
						91.0,
						22.0
					],
					"id": "obj-153"
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
						376.0,
						1681.0,
						140.0,
						22.0
					],
					"id": "obj-154"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "print generate",
					"numinlets": 1,
					"numoutlets": 0,
					"outlettype": [],
					"patching_rect": [
						526.0,
						1681.0,
						112.0,
						22.0
					],
					"id": "obj-155"
				}
			},
			{
				"box": {
					"maxclass": "newobj",
					"text": "route mode notes below above interval delay profile cadence seed count taste slicems",
					"numinlets": 2,
					"numoutlets": 13,
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
						"",
						"",
						"",
						""
					],
					"patching_rect": [
						20.0,
						1721.0,
						602.0,
						22.0
					],
					"id": "obj-156"
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
						20.0,
						1761.0,
						133.0,
						22.0
					],
					"id": "obj-157"
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
						163.0,
						1761.0,
						91.0,
						22.0
					],
					"id": "obj-158"
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
						264.0,
						1761.0,
						91.0,
						22.0
					],
					"id": "obj-159"
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
						365.0,
						1761.0,
						91.0,
						22.0
					],
					"id": "obj-160"
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
						466.0,
						1761.0,
						91.0,
						22.0
					],
					"id": "obj-161"
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
						567.0,
						1761.0,
						91.0,
						22.0
					],
					"id": "obj-162"
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
						20.0,
						1796.0,
						133.0,
						22.0
					],
					"id": "obj-163"
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
						163.0,
						1796.0,
						133.0,
						22.0
					],
					"id": "obj-164"
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
						306.0,
						1796.0,
						91.0,
						22.0
					],
					"id": "obj-165"
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
						407.0,
						1796.0,
						91.0,
						22.0
					],
					"id": "obj-166"
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
						508.0,
						1796.0,
						91.0,
						22.0
					],
					"id": "obj-167"
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
						609.0,
						1796.0,
						91.0,
						22.0
					],
					"id": "obj-168"
				}
			}
		],
		"lines": [
			{
				"patchline": {
					"source": [
						"obj-42",
						0
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
						"obj-43",
						0
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
						"obj-5",
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
						"obj-99",
						0
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
						"obj-8",
						0
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
						"obj-100",
						0
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
						"obj-10",
						0
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
						"obj-101",
						0
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
						"obj-13",
						0
					],
					"destination": [
						"obj-102",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-102",
						0
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
						"obj-15",
						0
					],
					"destination": [
						"obj-103",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-103",
						0
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
						"obj-17",
						0
					],
					"destination": [
						"obj-104",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-104",
						0
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
						"obj-20",
						1
					],
					"destination": [
						"obj-105",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-105",
						0
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
						"obj-22",
						0
					],
					"destination": [
						"obj-106",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-106",
						0
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
						"obj-40",
						0
					],
					"destination": [
						"obj-107",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-107",
						0
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
						"obj-24",
						0
					],
					"destination": [
						"obj-108",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-108",
						0
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
						"obj-26",
						0
					],
					"destination": [
						"obj-109",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-109",
						0
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
						"obj-28",
						0
					],
					"destination": [
						"obj-110",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-110",
						0
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
						"obj-30",
						0
					],
					"destination": [
						"obj-111",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-111",
						0
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
						"obj-33",
						0
					],
					"destination": [
						"obj-112",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-112",
						0
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
						"obj-35",
						0
					],
					"destination": [
						"obj-113",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-113",
						0
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
						"obj-37",
						0
					],
					"destination": [
						"obj-114",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-114",
						0
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
						"obj-46",
						0
					],
					"destination": [
						"obj-115",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-115",
						0
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
						"obj-116",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-116",
						0
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
						"obj-116",
						1
					],
					"destination": [
						"obj-117",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-117",
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
						"obj-116",
						2
					],
					"destination": [
						"obj-118",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-118",
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
						"obj-116",
						2
					],
					"destination": [
						"obj-119",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-116",
						4
					],
					"destination": [
						"obj-119",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-116",
						3
					],
					"destination": [
						"obj-120",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-120",
						0
					],
					"destination": [
						"obj-121",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-121",
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
						"obj-120",
						1
					],
					"destination": [
						"obj-122",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-122",
						0
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
						"obj-120",
						2
					],
					"destination": [
						"obj-123",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-123",
						0
					],
					"destination": [
						"obj-10",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-120",
						3
					],
					"destination": [
						"obj-124",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-124",
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
						"obj-120",
						4
					],
					"destination": [
						"obj-125",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-125",
						0
					],
					"destination": [
						"obj-15",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-120",
						5
					],
					"destination": [
						"obj-126",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-126",
						0
					],
					"destination": [
						"obj-17",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-120",
						6
					],
					"destination": [
						"obj-127",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-127",
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
						"obj-120",
						7
					],
					"destination": [
						"obj-128",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-128",
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
						"obj-120",
						8
					],
					"destination": [
						"obj-129",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-129",
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
						"obj-120",
						9
					],
					"destination": [
						"obj-130",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-130",
						0
					],
					"destination": [
						"obj-131",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-131",
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
						"obj-130",
						1
					],
					"destination": [
						"obj-132",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-132",
						0
					],
					"destination": [
						"obj-26",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-130",
						2
					],
					"destination": [
						"obj-133",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-133",
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
						"obj-130",
						3
					],
					"destination": [
						"obj-134",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-134",
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
						"obj-120",
						10
					],
					"destination": [
						"obj-135",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-135",
						0
					],
					"destination": [
						"obj-136",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-136",
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
						"obj-135",
						1
					],
					"destination": [
						"obj-137",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-137",
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
						"obj-135",
						2
					],
					"destination": [
						"obj-138",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-138",
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
						"obj-85",
						0
					],
					"destination": [
						"obj-139",
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
						"obj-139",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-60",
						1
					],
					"destination": [
						"obj-140",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-140",
						0
					],
					"destination": [
						"obj-139",
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
						"obj-141",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-141",
						0
					],
					"destination": [
						"obj-139",
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
						"obj-142",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-142",
						0
					],
					"destination": [
						"obj-139",
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
						"obj-143",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-143",
						0
					],
					"destination": [
						"obj-139",
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
						"obj-144",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-144",
						0
					],
					"destination": [
						"obj-139",
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
						"obj-145",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-145",
						0
					],
					"destination": [
						"obj-139",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-76",
						1
					],
					"destination": [
						"obj-146",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-146",
						0
					],
					"destination": [
						"obj-139",
						0
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
						"obj-147",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-147",
						0
					],
					"destination": [
						"obj-139",
						0
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
						"obj-148",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-148",
						0
					],
					"destination": [
						"obj-139",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-82",
						0
					],
					"destination": [
						"obj-149",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-149",
						0
					],
					"destination": [
						"obj-139",
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
						"obj-150",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-150",
						0
					],
					"destination": [
						"obj-139",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-107",
						0
					],
					"destination": [
						"obj-139",
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
						"obj-151",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-151",
						0
					],
					"destination": [
						"obj-139",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-139",
						0
					],
					"destination": [
						"obj-152",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-152",
						0
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
						"obj-152",
						1
					],
					"destination": [
						"obj-153",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-153",
						0
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
						"obj-152",
						2
					],
					"destination": [
						"obj-154",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-154",
						0
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
						"obj-152",
						2
					],
					"destination": [
						"obj-155",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-152",
						4
					],
					"destination": [
						"obj-155",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-152",
						3
					],
					"destination": [
						"obj-156",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-156",
						0
					],
					"destination": [
						"obj-157",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-157",
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
						"obj-156",
						1
					],
					"destination": [
						"obj-158",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-158",
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
						"obj-156",
						2
					],
					"destination": [
						"obj-159",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-159",
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
						"obj-156",
						3
					],
					"destination": [
						"obj-160",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-160",
						0
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
						"obj-156",
						4
					],
					"destination": [
						"obj-161",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-161",
						0
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
						"obj-156",
						5
					],
					"destination": [
						"obj-162",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-162",
						0
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
						"obj-156",
						6
					],
					"destination": [
						"obj-163",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-163",
						0
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
						"obj-156",
						7
					],
					"destination": [
						"obj-164",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-164",
						0
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
						"obj-156",
						8
					],
					"destination": [
						"obj-165",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-165",
						0
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
						"obj-156",
						9
					],
					"destination": [
						"obj-166",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-166",
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
						"obj-156",
						10
					],
					"destination": [
						"obj-167",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-167",
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
						"obj-156",
						11
					],
					"destination": [
						"obj-168",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-168",
						0
					],
					"destination": [
						"obj-40",
						0
					]
				}
			}
		]
	}
}
