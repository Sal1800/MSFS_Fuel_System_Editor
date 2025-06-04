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
          const optionStr = optionList && optionList.map(options => `#Option:${options.join(',')}${options.length > 1 ? ',' : ''}`).join(' ');
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



}