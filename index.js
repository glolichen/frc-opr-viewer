const urlBase = "https://www.thebluealliance.com/api/v3/event/"
const submitEventButton = document.getElementById("submiteventbutton");

class TeamInfo {
	constructor(number, opr) {
		this.number = number;
		this.opr = opr;
	}
}

class Match {
	constructor(number, type, r1, r2, r3, b1, b2, b3, rScore, bScore, obj) {
		this.number = number;
		this.type = type;
		this.r1 = r1;
		this.r2 = r2;
		this.r3 = r3;
		this.b1 = b1;
		this.b2 = b2;
		this.b3 = b3;
		this.rScore = rScore;
		this.bScore = bScore;
		this.obj = obj;
	}
	
	priority() {
		let numType = 0;
		if (this.type == "F")
			numType = 3000;
		else if (this.type == "M")
			numType = 2000;
		else if (this.type == "Q")
			numType = 1000;
		return numType + this.number;
	}
}

let matches = [], teams = new Set();

submitEventButton.onclick = () => {
	const apiKey = document.getElementById("apikey");
	const eventName = document.getElementById("eventname");

	const table = document.getElementById("table");
	const oprTable = document.getElementById("oprtable");

	const key = apiKey.value
	const event = eventName.value

	const authParam = "?X-TBA-Auth-Key=" + key;
	const url = urlBase + event + "/matches" + authParam;

	var request = new XMLHttpRequest();
	request.open("GET", url, false);
	request.send(null);
	
	const response = JSON.parse(request.responseText);
	if (Object.keys(response).length == 1) {
		alert(response["Error"]);
		return;
	}

	table.children[1].innerHTML = "";
	oprTable.children[1].innerHTML = "";
	
	matches = []
	teams = new Set();
	
	for (let i = 0; i < response.length; i++) {
		const match = response[i];

		let matchNumber = "", matchType = "";
		if (match["comp_level"] == "qm") {
			matchNumber = match["match_number"];
			matchType = "Q";
		}
		else if (match["comp_level"] == "sf") {
			matchNumber = match["set_number"];
			matchType = "M";
		}
		else if (match["comp_level"] == "f") {
			matchNumber = match["match_number"];
			matchType = "F";
		}

		const blue = match["alliances"]["blue"]["team_keys"]
		const red = match["alliances"]["red"]["team_keys"]

		const r1 = parseInt(red[0].replace("frc", ""));
		const r2 = parseInt(red[1].replace("frc", ""));
		const r3 = parseInt(red[2].replace("frc", ""));

		const b1 = parseInt(blue[0].replace("frc", ""));
		const b2 = parseInt(blue[1].replace("frc", ""));
		const b3 = parseInt(blue[2].replace("frc", ""));
		
		teams.add(r1);
		teams.add(r2);
		teams.add(r3);
		teams.add(b1);
		teams.add(b2);
		teams.add(b3);

		const blueScore = parseInt(match["alliances"]["blue"]["score"])
		const redScore = parseInt(match["alliances"]["red"]["score"])

		matches.push(new Match(
			parseInt(matchNumber),
			matchType,
			r1, r2, r3,
			b1, b2, b3,
			redScore, blueScore,
			match
		))
	}

	matches.sort(function (a, b) {
		return a.priority() > b.priority() ? 1 : -1;
	});
	
	for (let i = 0; i < response.length; i++) {
		const match = matches[i];

		const row = document.createElement("tr");

		var check = document.createElement("input");
		check.setAttribute("type", "checkbox"); 
		check.setAttribute("id", i + "check");
		check.checked = match.rScore != -1 && match.bScore != -1;
		check.style = "width:150%;height:100%";

		var redInput = document.createElement("input");
		redInput.setAttribute("type", "number"); 
		redInput.setAttribute("id", i + "redscore");
		redInput.setAttribute("class", "scorebox");
		redInput.setAttribute("size", 3);
		redInput.value = match.rScore;

		var blueInput = document.createElement("input");
		blueInput.setAttribute("type", "number"); 
		blueInput.setAttribute("id", i + "bluescore");
		blueInput.setAttribute("class", "scorebox");
		blueInput.setAttribute("size", 3);
		blueInput.value = match.bScore;

		row.insertCell().appendChild(check);

		row.insertCell().textContent = match.type + match.number;
		row.insertCell().innerHTML = `<p class='red'>${match.r1}</p>`;
		row.insertCell().innerHTML = `<p class='red'>${match.r2}</p>`;
		row.insertCell().innerHTML = `<p class='red'>${match.r3}</p>`;
		row.insertCell().innerHTML = `<p class='blue'>${match.b1}</p>`;
		row.insertCell().innerHTML = `<p class='blue'>${match.b2}</p>`;
		row.insertCell().innerHTML = `<p class='blue'>${match.b3}</p>`;
		row.insertCell().appendChild(redInput);
		row.insertCell().appendChild(blueInput);
		
		table.children[1].appendChild(row);
	}
}

const calculateButton = document.getElementById("calculatebutton");
calculateButton.onclick = () => {
	if (teams.length == 0 || matches.length == 0)
		return;
	
	const teamsArray = Array.from(teams);
	const numTeams = teamsArray.length;
	
	// see https://blog.thebluealliance.com/2017/10/05/the-math-behind-opr-an-introduction/
	
	let M = [], s = [];
	for (let i = 0; i < matches.length; i++) {
		const used = document.getElementById(i + "check");
		if (!used.checked)
			continue;

		const match = matches[i];

		const redTeams = Array.of(
			teamsArray.indexOf(match.r1),
			teamsArray.indexOf(match.r2),
			teamsArray.indexOf(match.r3),
		);
		const blueTeams = Array.of(
			teamsArray.indexOf(match.b1),
			teamsArray.indexOf(match.b2),
			teamsArray.indexOf(match.b3)
		);
		
		let rowRed = new Array(numTeams), rowBlue = new Array(numTeams);
		for (let j = 0; j < numTeams; j++) {
			rowRed[j] = redTeams.indexOf(j) == -1 ? 0 : 1;
			rowBlue[j] = blueTeams.indexOf(j) == -1 ? 0 : 1;
		}
		
		M.push(rowRed);
		M.push(rowBlue);
		
		const redScore = parseInt(document.getElementById(i + "redscore").value);
		const blueScore = parseInt(document.getElementById(i + "bluescore").value);
		
		s.push([redScore]);
		s.push([blueScore]);
	}
	
	console.log(M);
	
	M = math.matrix(M);
	const MT = math.transpose(M);
	
	let MTMinv;
	try {
		MTMinv = math.inv(math.multiply(MT, M));
	} catch {
		alert("Not enough matches!");
		return;
	}
	const MTMinvMT = math.multiply(MTMinv, MT);
	
	s = math.matrix(s);
	
	X = math.multiply(MTMinvMT, s);
	
	const rawOPR = X._data;
	
	const teamInfo = []
	for (let i = 0; i < rawOPR.length; i++)
		teamInfo.push(new TeamInfo(teamsArray[i], rawOPR[i][0]));
	
	teamInfo.sort(function (a, b) {
		return a.opr > b.opr ? -1 : 1;
	});
	
	const oprTable = document.getElementById("oprtable");
	oprTable.children[1].innerHTML = "";
	for (let i = 0; i < teamInfo.length; i++) {
		const row = document.createElement("tr");

		row.insertCell().textContent = teamInfo[i].number;
		row.insertCell().textContent = Math.round(teamInfo[i].opr * 100) / 100;
		
		oprTable.children[1].appendChild(row);
	}
}
