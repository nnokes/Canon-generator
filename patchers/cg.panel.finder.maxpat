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
					"text": "Open the canon panel too: the finder searches the melody it plays (a preset's, or your .mid), and plays there the result you click. How to read the results: at the bottom.",
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
					"text": "0 = with the melody. every = the step between tries",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						470.0,
						165.0,
						341.5,
						20.0
					],
					"id": "obj-17",
					"presentation": 1,
					"presentation_rect": [
						470.0,
						165.0,
						341.5,
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
					"text": "smaller = smoother, bigger = sooner",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						280.0,
						235.0,
						237.5,
						20.0
					],
					"id": "obj-24",
					"presentation": 1,
					"presentation_rect": [
						280.0,
						235.0,
						237.5,
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
					"text": "abandons the search",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						655.0,
						235.0,
						133.5,
						20.0
					],
					"id": "obj-27",
					"presentation": 1,
					"presentation_rect": [
						655.0,
						235.0,
						133.5,
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
						275.0,
						322.0,
						20.0
					],
					"id": "obj-28",
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
					"id": "obj-29",
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
					"id": "obj-30",
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
					"id": "obj-31",
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
					"text": "How to read it",
					"numinlets": 1,
					"numoutlets": 0,
					"fontface": 1,
					"patching_rect": [
						20.0,
						375.0,
						101.0,
						20.0
					],
					"id": "obj-32",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						375.0,
						101.0,
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
					"linecount": 6,
					"patching_rect": [
						20.0,
						400.0,
						370.0,
						98.0
					],
					"id": "obj-33",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						400.0,
						370.0,
						98.0
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
						506.0,
						370.0,
						56.0
					],
					"id": "obj-34",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						506.0,
						370.0,
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
					"linecount": 5,
					"patching_rect": [
						20.0,
						570.0,
						370.0,
						84.0
					],
					"id": "obj-35",
					"presentation": 1,
					"presentation_rect": [
						20.0,
						570.0,
						370.0,
						84.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Status: done: 3 clean of 152 = 152 followers tried, 3 without faults. With 3 or more voices the finder tries each follower against the melody alone (pass alone), pairs the ones that pass (fit together), makes sets only of pairs that fit, and judges each set whole. stopped at the budget (in the Max window) = 20000 canons tried: narrow the ranges.",
					"numinlets": 1,
					"numoutlets": 0,
					"linecount": 7,
					"patching_rect": [
						410.0,
						400.0,
						370.0,
						112.0
					],
					"id": "obj-36",
					"presentation": 1,
					"presentation_rect": [
						410.0,
						400.0,
						370.0,
						112.0
					]
				}
			},
			{
				"box": {
					"maxclass": "comment",
					"text": "Rules: canon = Albrechtsberger's florid canon rules (the default). florid = the same without the two canon rules (a beat's rest before a voice comes back; no phrase starting a 7th or 9th from the last). fux-strict = note against note: strict, few results. spectral = no hard rules; the cost comes from roughness and parallels. free = no rules: everything is clean. Perpetual: every voice loops, so where the melody wraps around is judged too.",
					"numinlets": 1,
					"numoutlets": 0,
					"linecount": 9,
					"patching_rect": [
						410.0,
						520.0,
						370.0,
						140.0
					],
					"id": "obj-37",
					"presentation": 1,
					"presentation_rect": [
						410.0,
						520.0,
						370.0,
						140.0
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
						410.0,
						668.0,
						370.0,
						70.0
					],
					"id": "obj-38",
					"presentation": 1,
					"presentation_rect": [
						410.0,
						668.0,
						370.0,
						70.0
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
						766.0,
						760.0,
						42.0
					],
					"id": "obj-39"
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
						816.0,
						77.0,
						22.0
					],
					"id": "obj-40"
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
						856.0,
						112.0,
						22.0
					],
					"id": "obj-41"
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
						856.0,
						154.0,
						22.0
					],
					"id": "obj-42"
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
						856.0,
						140.0,
						22.0
					],
					"id": "obj-43"
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
						856.0,
						133.0,
						22.0
					],
					"id": "obj-44"
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
						856.0,
						119.0,
						22.0
					],
					"id": "obj-45"
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
						891.0,
						133.0,
						22.0
					],
					"id": "obj-46"
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
						891.0,
						119.0,
						22.0
					],
					"id": "obj-47"
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
						891.0,
						133.0,
						22.0
					],
					"id": "obj-48"
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
						891.0,
						119.0,
						22.0
					],
					"id": "obj-49"
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
						936.0,
						98.0,
						22.0
					],
					"id": "obj-50"
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
						976.0,
						245.0,
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
						290.0,
						976.0,
						91.0,
						22.0
					],
					"id": "obj-52"
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
						976.0,
						140.0,
						22.0
					],
					"id": "obj-53"
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
						976.0,
						98.0,
						22.0
					],
					"id": "obj-54"
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
						1016.0,
						644.0,
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
						20.0,
						1056.0,
						91.0,
						22.0
					],
					"id": "obj-56"
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
						1056.0,
						91.0,
						22.0
					],
					"id": "obj-57"
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
						1056.0,
						91.0,
						22.0
					],
					"id": "obj-58"
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
						1056.0,
						91.0,
						22.0
					],
					"id": "obj-59"
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
						1056.0,
						91.0,
						22.0
					],
					"id": "obj-60"
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
						1056.0,
						91.0,
						22.0
					],
					"id": "obj-61"
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
						1056.0,
						133.0,
						22.0
					],
					"id": "obj-62"
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
						1091.0,
						91.0,
						22.0
					],
					"id": "obj-63"
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
						1091.0,
						91.0,
						22.0
					],
					"id": "obj-64"
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
						"obj-40",
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
						"obj-40",
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
						"obj-40",
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
						"obj-40",
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
						"obj-40",
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
						"obj-40",
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
						"obj-40",
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
						"obj-46",
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
						"obj-40",
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
						"obj-40",
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
						"obj-40",
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
						"obj-40",
						0
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
						"obj-29",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-51",
						1
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
						"obj-31",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-51",
						2
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
						"obj-31",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-51",
						2
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
						"obj-51",
						4
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
						"obj-51",
						3
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
						"obj-4",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-55",
						1
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
						"obj-57",
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
						"obj-55",
						2
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
						"obj-58",
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
						"obj-55",
						3
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
						"obj-59",
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
						"obj-55",
						4
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
						"obj-14",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-55",
						5
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
						"obj-16",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-55",
						6
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
						"obj-19",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-55",
						7
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
						"obj-21",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-55",
						8
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
						"obj-23",
						0
					]
				}
			}
		]
	}
}
