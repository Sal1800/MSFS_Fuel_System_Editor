export default class Config {
    constructor() {
    }

  // returns a configuration-formatted string of the properties with non-empty values
  writeNodeConfig(properties) {
    let out = '';
    Object.keys(properties).map( p => {
      if (properties[p] != '') {
        out += `#${p}:${properties[p]} `;
      }
    });
    return out;    
  }

  convertLines(lines) {
    let output = '';
    lines.forEach(line => {
      let lineStr = `Line.${line.index} = Name:${line.name} #Source:${line.source} #Destination:${line.destination} `;      
      lineStr += this.writeNodeConfig({
        'FuelFlowAt1PSI': line.data.fuelflow || '',
        'Volume': line.data.volume || '',
        'GravityBasedFuelFlow': line.data.gravity || '',
      });
      output += lineStr + '\n';
    });
    return output;
  }


  // arg lines must come from configState
  convertNodes(nodes, lines) {
    let output = '[FUEL_SYSTEM]\nVersion = Latest\n';
    nodes.sort((a, b) => a.class.localeCompare(b.class)).forEach(node => {
      const inputLines = lines.filter(line => line.destination === (node.data.itemname || node.data.name)).map( line => line.name);
      const outputLines = lines.filter(line => line.source === (node.data.itemname || node.data.name)).map( line => line.name);
      let nodeStr = `${node.class}.${node.data.index} = Name:${node.data.itemname || node.data.name} `;
      if(node.data.itemtitle) {
        nodeStr += `#Title:${node.data.itemtitle || ''} `;
      }
      switch (node.class) {
      	case 'Engine': 
      		nodeStr += `#Index:${node.data.engineindex || node.data.index} `;
      		break;
        case 'Tank':
          nodeStr += this.writeNodeConfig({
            'Capacity': node.data.capacity || '',
            'UnusableCapacity': node.data.unusablecapacity || '',
            'Position': node.data.position || '0,0,0',
            'InputOnlyLines': inputLines.join(','),
            'OutputOnlyLines': outputLines.join(','),
            'DropTimer': node.data.droptimer || '',
            'Priority': node.data.priority || '',
          });
          break;
        case 'Pump':
          nodeStr += this.writeNodeConfig({
            'Pressure': node.data.pressure || '',
            'PressureCurve': node.data.curve || '',
            'TankFuelRequired': node.data.tankfuelrequired || '',
            'DestinationLine': outputLines[0],
            'Type': node.data.pumptype || '',
            'Index': node.data.droptimer || '',
            'AutoCondition': node.data.autocondition || '',
            'PressureDecreaseRate': node.data.pressuredecrease || '',
          });
          break;
        case 'Junction':
          const optionList = node.data.optionlist;
          // const optionStr = optionList && optionList.map(options => `#Option:${options.join(',')}${options.length > 1 ? ',' : ''}`).join(' ');
          const optionStr = optionList && optionList.map(options => `#Option:${options.join(',')}`).join(' ');
          nodeStr += optionStr || ''; 
          nodeStr += this.writeNodeConfig({
            'InputOnlyLines': inputLines.join(','),
            'OutputOnlyLines': outputLines.join(','),
          });
          break;
        case 'Valve':
          nodeStr += node.data.oneway ? `#DestinationLine:${outputLines.join(',')} ` : '';
          nodeStr += this.writeNodeConfig({
            'OpeningTime': node.data.openingtime || '',
            'Circuit': node.data.circuitindex || '',
          });          
          break;
        case 'APU':
          nodeStr += `#FuelBurnRate:${node.data.fuelburn || ''}`;
          break;  
        case 'Curve':
          // this overwrites the nodeStr removing #Name and #Title
          nodeStr = `${node.class}.${node.data.index} = ${node.data.params}`;
          break;  
      }
      output += `${nodeStr} \n`;
    });
    return output;
  }

  importConfig(configStr) {
  	const nodeList = [];
  	const lineList = [];
  	const lines = configStr.replaceAll('\\n','\n').split('\n');
  	lines.forEach( line => {
		const nodeParts = line.match(/([^\.]+)\.([^\s]+)[\s=]+(.+)$/);
		if (nodeParts && nodeParts.length === 4) {
			if (nodeParts[1] === 'Line') {
				const parsedLine = this.parseLine(nodeParts);
		  		if (Object.keys(parsedLine).length) {
					lineList.push(parsedLine);
		  		}				
			} else {
		  		const parsedNode = this.parseNode(nodeParts);
		  		if (Object.keys(parsedNode).length) {
					nodeList.push(parsedNode);
		  		}
		  	}
		}
  	});
  	const graph = this.processNodes(nodeList, lineList);
  	// return lineStrings;
  	return graph;
  }

  parseNode(nodeParts) {
	const nodeTypeStr = nodeParts[1];  	
	const nodeIndex = nodeParts[2];
	const nodeParams = nodeParts[3].split('#');
  	const node = {};
	node.data = { index: nodeIndex, name: `${nodeTypeStr}.${nodeIndex}` };
	node.name = nodeTypeStr;
	const nodeProperties = this.getNodeProperties(nodeTypeStr);
	if (nodeProperties) {
		const propKeys = Object.keys(nodeProperties);
  		nodeParams.forEach( (p) => {
  			// const param = p.split(':');
  			const param = p.match(/([^:]+):(.+)/);
  			const propKey = propKeys.indexOf(param[1].trim());
  			const propName = propKeys[propKey]
  			if (propName) {
  				if (node.data[nodeProperties[propName]]) {
  					// append to existing property with ':' delimiter (Option can have multiple entries)
  					node.data[nodeProperties[propName]] += `:${param[2].trim()}`;
  				} else {
  					node.data[nodeProperties[propName]] = param[2].trim();
  				}
  			}
  			// special handling for curve node
  			if (!propKeys.length) {
  				node.data.params = p.trim();
  			}
		});
  	}
  	return node;
  }

  parseLine(lineParts) {
  	const lineParams = lineParts[3].split('#');
  	const line = {};
  	const lineProperties = this.getNodeProperties('Line');
  	const propKeys = Object.keys(lineProperties);
	lineParams.forEach( (p) => {
		const param = p.split(':');
		const propKey = propKeys.indexOf(param[0].trim());
		const propName = propKeys[propKey]
		if (propName) {
			line[lineProperties[propName]] = param[1].trim();
		}
	});
	return line;
  }

  // after parsing nodes and lines, assemble into drawflow JSON
  processNodes(nodes, lines) {
  	// each node will be placed with this offset from the previous
  	const offset_x = 260;
  	const offset_y = 50;

  	const graph = {
  		'drawflow': {
  			'Home': {
  				'data': {},
  			}
  		}
  	};
  	// add the drawflow node properties
  	for (const [i, node] of nodes.entries()) {
  		graph.drawflow.Home.data[i] = {
  			"id": i,
  			"name": node.name,
  			"data": node.data,
       		"class": node.name,
          	"html": node.name,
          	"typenode": "vue",
          	"inputs": {},
          	"outputs": {},
          	"pos_x": i * offset_x,
          	"pos_y": i * offset_y,
  		}
	}
	// loop through the lines and set the input/outputs on the nodes
	lines.forEach( line => {
		if (line.source) {
			const graphNodes = Object.values(graph.drawflow.Home.data);
			const sourceNode = graphNodes.find( n => n.data.itemname === line.source);
			const destinationNode = graphNodes.find( n => n.data.itemname === line.destination);
			const gSource = graph.drawflow.Home.data[sourceNode.id];
			const gDest = graph.drawflow.Home.data[destinationNode.id];			
			const sOutputKey = `output_${Object.keys(gSource.outputs).length + 1}`;
			const dInputKey = `input_${Object.keys(gDest.inputs).length + 1}`;
			gSource.outputs[sOutputKey] = {
				"connections": [
					{
						"node": destinationNode.id,
						"output": dInputKey,
					}
				]
			};
			gDest.inputs[dInputKey] = {
				"connections": [
					{
						"node": sourceNode.id,
						"input": sOutputKey,
					}
				]
			};			
		}
	});

	// adjust some of the data properties
  	for (const [i, node] of nodes.entries()) {
		if (node.data.optionlist) {
			const options = node.data.optionlist.split(':');
			const final = [];
			options.forEach( o => {
				final.push(o.split(','))
			})
			node.data.optionlist = final;
		}
		if (node.data.oneway) {
			node.data.oneway = true;
		}
	}
	return graph;
  }

  /*
  	The returned object has the keys matching the MSFS config param 
  	and the value matches the drawflow node data property
  */
  getNodeProperties(nodeTypeStr) {
  	switch (nodeTypeStr) {
  		case 'Curve':
  			return {}
  		case 'Engine':
  			return {
  				'Name': 'itemname',
  				'Index': 'engineindex',
  			}
  		case 'Tank':
  			return {
  				'Name': 'itemname',
  				'Title': 'itemtitle',
  				'Capacity': 'capacity',
  				'UnusableCapacity': 'unusuablecapacity',
  				'Position': 'position',
  				'DropTimer': 'droptimer',
  				'Priority': 'priority',
  				'OutputOnlyLines': 'outputonlylines',
  			}
  		case 'Pump':
  			return {
  				'Name': 'itemname',
  				'Title': 'itemtitle',
	  		    'Pressure': 'pressure',
	            'PressureCurve': 'curve',
	            'TankFuelRequired': 'tankfuelrequired',
	            'Type': 'pumptype',
	            'Index': 'droptimer',
	            'AutoCondition': 'autocondition',
	            'PressureDecreaseRate': 'pressuredecrease',
	            'DestinationLine': 'oneway',
	        }
  		case 'Junction':
  			return {
  				'Name': 'itemname',
  				'Title': 'itemtitle',
	  		    'Option': 'optionlist',
	        }
  		case 'Valve':
  			return {
  				'Name': 'itemname',
  				'Title': 'itemtitle',
  				'DestinationLine': 'oneway',
	  		    'OpeningTime': 'openingtime',
	  		    'Circuit': 'circuitindex',
	        }
  		case 'APU':
  			return {
  				'Name': 'itemname',
  				'Title': 'itemtitle',
	  		    'FuelBurnRate': 'fuelburn',
	        }
  		case 'Line':
  			return {
  				'Name': 'itemname',
  				'Source': 'source',
	  		    'Destination': 'destination',
	  		    'FuelFlowAt1PSI': 'fuelflow',
	  		    'Volume': 'volume',
	  		    'GravityBasedFuelFlow': 'gravityflow',
	        }
  	}
  }

}