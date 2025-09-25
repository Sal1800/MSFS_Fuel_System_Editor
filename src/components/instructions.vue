<template>
<div class="instructions">
  <h2><strong>Overview</strong></h2>

  <p>The purpose of this app is to aid in developing the configuration for fuel systems in Microsoft Flight Simulator (MSFS)*. Such a fuel system can have many parts that are interconnected and having a node-based editor can be easier to manage than keeping track of a text-only configuration.</p>

  <p>* This project is not affiliated with Microsoft</p>

  <p>When you have connected the nodes as desired and filled in the properties, you can export the text configuration to use in your aircraft projects.</p>

  <p>For a detailed explanation of all the nodes and available properties, see the official documentation here: 

    <a href="https://docs.flightsimulator.com/msfs2024/html/5_Content_Configuration/CFG_Files/flight_model_cfg.htm#FUEL_SYSTEM">docs.flightsimulator.com</a>
  </p>

  <p>It is possible that future versions of MSFS will change some fuel system properties. I hope to update the app to match changes. But this project is also available as open source: <a href="https://github.com/Sal1800/MSFS_Fuel_System_Editor">github.com/Sal1800/MSFS_Fuel_System_Editor</a></p>

  <h2><strong>User Interface</strong></h2>

  <p>The sidebar on the left contains a list of the available nodes. Drag these onto the main graph area to place a node. To delete a node, highlight it and press the delete key.</p>

  <p>As you add nodes to the graph, they will appear in a list in the sidebar. The nodes will get named automatically but most node types have a Name property where you can enter a unique name. This name is used as a reference to the part so it should not contain spaces or other special characters.</p>

  <p>Most nodes have connection points to connect to other nodes. These are shown as circles on the sides of the node. Drag a line between the output of one node to the input of another to create a line. Lines are also saved into the fuel system configuration which is one of the automations this tool provides.</p>

  <p>To pan the main graph, use right-click and drag in the background or middle-click and drag. To zoom, hold ctrl and scroll the mouse wheel. </p>

  <h2><strong>Node Properties and Connections</strong></h2>

  <p>To understand the purpose of the node properties, you will need to refer to the <a href="https://docs.flightsimulator.com/msfs2024/html/5_Content_Configuration/CFG_Files/flight_model_cfg.htm#FUEL_SYSTEM">Official Documentation</a> but some the following nodes have some special features requiring explanation.</p>

  <p>The Junction node is the only node that can have multiple connections into or out of it. ALL other nodes can have at most one input and one ouput. The interface does allows you to connect two lines into one input but this will not create a valid final output.</p>

  <p>When you connect to the input of a Junction, it will create a new input port and continue to do so for as many inputs as needed. The same is true for ouputs.</p>

  <p>The Options property of the Junction node allows you to join any inputs to ouputs and also switch which groups are used at a time. These are select drop-downs listing all the connected lines.</p>

  <p>The Curve node requires a formatted property. The Params expects a list of x:y coordinates. (<code>0:0, 0.5:0.5, 1:1</code>). If you enter a valid list of coordinates, it should draw a representation of that curve. The Curve node does not have a line connection, it is referenced in a Pump node.</p>

  <p>Lines use a special handling routine. The get automatically created as you connect nodes and their name will update as you change the node Names. Lines can have properties and these are accessed by clicking a line or the gear icon in the list to open a sidebar popup. These properties are specific to the exact Line name so if you rename a line, you will need to reenter the properties.</p>

  <h2><strong>Import, Export and Saving</strong></h2>

  <p>You can export two types of data. Nodes or Config. Nodes contains all of the node graph data including positions and is used to save your work. The Config export is what you will copy and paste into the flight_model.cfg file in your MSFS project.</p>

  <p>The graph is autosaved to your browser's localStorage so refreshing the page or returning from a bookmark should restore your last working state.</p>

  <p>The Import dialog offers a place to paste either a Node type or Config type block of text. When you import a Config block, the nodes will be connected but the order and position will requires some re-positioning to be more useful.</p>

  <p>Sal1800</p> 


</div>
</template>
<script>

import '../assets/style.css' 
import { h, render, ref,} from 'vue'


export default {
  name: 'instructions',
  setup() {

  }
}

</script>
<style scoped>
  .instructions {
    padding: 0 64px 36px;
  }
  .instructions h2 {
    font-size: 20px;
    margin-top: 1.4em;
    margin-bottom: 0.5em;
  }

  .instructions > p {
    margin-bottom: 1.4em;
  }

</style>