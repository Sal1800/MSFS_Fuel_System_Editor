<template>
<div class="node-edit">
<el-container>
  <el-header class="header">
      <h3>MSFS Fuel System Editor</h3>
      <div class="button-group">
        <el-button    @click="clearNodes">Clear Nodes</el-button>
        <el-button    @click="importDialog = true; importField = ''">Import</el-button>
        <el-button    @click="exportEditor">Export Nodes</el-button>
        <el-button type="primary"   @click="exportConfig">Export Config</el-button>
      </div>
  </el-header>
  <el-container class="container">
    <el-aside width="250px" class="column sidebar">
        <ul>
            <li v-for="n in listNodes" :key="n" draggable="true" :data-node="n.item" @dragstart="drag($event)" class="drag-drawflow" >
                <div class="node" :class="n.name" >{{ n.name }}</div>
            </li>
        </ul>
        <div class="node-list">
          <div v-for="list in nodesByType"  :key="list.type" class="list">
            <span>{{list.type}}s:</span>
            <div v-for="node in list.nodes" :key="node" class="type-items">
              {{node.data.itemname || node.data.name}}
            </div>
          </div>
          
          <div class="list">
            Lines:
            <div class="line-items" v-for="line in lineList" :key="line.Name">{{line.name}}</div>
          </div>
        </div>
    </el-aside>
    <el-main>
        <div id="drawflow" @drop="drop($event)" @dragover="allowDrop($event)"></div>
    </el-main>
  </el-container>
</el-container>
  <el-dialog
    v-model="dialogVisible"
    title="Export Node Graph"
    width="60%"
  >
    <p>Backup or save node graph versions with this JSON data</p>
    <pre class="overflow"><code>{{dialogData}}</code></pre>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="() => {copyToClipboard(dialogData)}">Copy</el-button>
        <!-- <el-button @click="dialogVisible = false">Cancel</el-button> -->
        <el-button type="primary" @click="dialogVisible = false"
          >OK</el-button
        >
      </span>
    </template>
  </el-dialog>
  <el-dialog
    v-model="clearConfirm"
    title="Clear All Nodes"
    width="500"
  >
    <span>Are you sure you want to remove all nodes?</span>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="clearConfirm = false">Cancel</el-button>
        <el-button type="primary" @click="clearNodes">
          Confirm
        </el-button>
      </div>
    </template>
  </el-dialog>
  <el-dialog
    v-model="importDialog"
    title="Import Data"
    width="500"
    @closed="closeImport"
  >
    <p>This will overwrite the current graph!</p>

    <div class="error" v-if="importError">{{importError}}</div>

    <span>Import MSFS Config - plain text [FUEL_SYSTEM]</span>
    <el-form-item>
        <el-input v-model="importConfigField" :rows="6" type="textarea" placeholder="Paste Data"></el-input>
    </el-form-item>
    <el-button type="primary" @click="doConfigImport">
      Import MSFS Config
    </el-button>
    <br>
    <span>Import Node Graph - JSON nodes</span>
    <el-form-item>
        <el-input v-model="importField" :rows="6" type="textarea" placeholder="Paste Data"></el-input>
    </el-form-item>
    <el-button type="primary" @click="doImport(null)">
      Import Node Graph
    </el-button>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="importDialog = false">Cancel</el-button>
      </div>
    </template>
  </el-dialog>

</div>
</template>
<script>

// import '../drawflow/drawflow.min.js'
import '../drawflow/drawflow.min.css'
import Drawflow from 'drawflow'
import '../assets/style.css' 
import { onMounted, shallowRef, h, getCurrentInstance, render, readonly, ref, computed, nextTick, useTemplateRef} from 'vue'
import Config from './config_io.js'

import tankNode from './nodes/tankNode.vue'
import pumpNode from './nodes/pumpNode.vue'
import junctionNode from './nodes/junctionNode.vue'
import valveNode from './nodes/valveNode.vue'
import engineNode from './nodes/engineNode.vue'
import curveNode from './nodes/curveNode.vue'
import apuNode from './nodes/apuNode.vue'
import triggerNode from './nodes/triggerNode.vue'

export default {
  name: 'nodeEdit',
  setup() {

    // list the available nodes and the input and output count
   const listNodes = readonly([
        {
            name: 'Tank',
            item: 'Tank',
            input:1,
            output:1,
        },
        {
            name: 'Pump',
            item: 'Pump',
            input:1,
            output:1,
        },
         {
            name: 'Junction',
            item: 'Junction',
            input:1,
            output:1,
        },
         {
            name: 'Valve',
            item: 'Valve',
            input:1,
            output:1,
        }, 
        {
            name: 'Engine',
            item: 'Engine',
            input:1,
            output:0,
        },
        {
            name: 'APU',
            item: 'APU',
            input:1,
            output:0,
        },        
        {
            name: 'Curve',
            item: 'Curve',
            input:0,
            output:0,
        },
        {
            name: 'Trigger',
            item: 'Trigger',
            input:0,
            output:0,
        },                                
    ])
   
   const editor = shallowRef({})
   const dialogVisible = ref(false)
   const dialogData = ref({})
   const connections = ref([])
   const nodesByType = ref([])
   const lineList = ref([])
   const clearConfirm = ref(false)
   const importDialog = ref(false)
   const importField = ref('')
   const importConfigField = ref('')
   const importError = ref('')

   const config_io = new Config

   const Vue = { version: 3, h, render };
   const internalInstance = getCurrentInstance()
   internalInstance.appContext.app._context.config.globalProperties.$df = editor;
   
    function exportEditor() {
      dialogData.value = editor.value.export();
      dialogVisible.value = true;
    }

    function exportConfig() {
      const exp = editor.value.export();
      const nodes = Object.values(exp.drawflow.Home.data);
      const lines = getConfigState();
      const nodeConfig = config_io.convertNodes(nodes, lines);
      const lineConfig = config_io.convertLines(lines);
      dialogData.value = JSON.stringify(getConfigState(), null, 2);
      dialogData.value = nodeConfig + lineConfig;
      dialogVisible.value = true;
    }


    function clearNodes() {
      if (clearConfirm.value){
        editor.value.clear(); 
        clearConfirm.value = false;
      } else {
        clearConfirm.value = true;
      }
    }

    function doImport(data) {
      if ((importField || data) && editor && editor.value) {
        const currentData = editor.value.export();
        try {
          const importData = data || JSON.parse(importField.value);
          editor.value.import(importData);
          importError.value = '';
          importDialog.value = false;
        } 
        catch (e) {
          editor.value.import(currentData);
          importError.value = 'Error importing data.' + e;
        }
      }
    }

    function doConfigImport() {
      if (importConfigField) {
          const fieldStr = importConfigField.value.replace('\"','');
          const result = config_io.importConfig(fieldStr);
          importConfigField.value = '';
          doImport(result);
      }
    }

    function closeImport() {
       importError.value = '';
    }


    function copyToClipboard(text) {
      const json = JSON.stringify(text);
      // const type = text.substring(0,1);
      navigator.permissions.query({ name: "clipboard-write" }).then((result) => {
      if (result.state === "granted" || result.state === "prompt") {
          const output = (typeof text === 'object') ? json : text;
          navigator.clipboard.writeText(output);
        }
      });
    }


    const drag = (ev) => {
      if (ev.type === "touchstart") {
        mobile_item_selec = ev.target.closest(".drag-drawflow").getAttribute('data-node');
      } else {
      ev.dataTransfer.effectAllowed = 'all';
      ev.dataTransfer.setData("node", ev.currentTarget.getAttribute('data-node'));
      }
    }
    const drop = (ev) => {
      if (ev.type === "touchend") {
        var parentdrawflow = document.elementFromPoint( mobile_last_move.touches[0].clientX, mobile_last_move.touches[0].clientY).closest("#drawflow");
        if(parentdrawflow != null) {
          addNodeToDrawFlow(mobile_item_selec, mobile_last_move.touches[0].clientX, mobile_last_move.touches[0].clientY);
        }
        mobile_item_selec = '';
      } else {
        ev.preventDefault();
        var data = ev.dataTransfer.getData("node");
        addNodeToDrawFlow(data, ev.clientX, ev.clientY);
      }

    }
    const allowDrop = (ev) => {
      ev.preventDefault();
    }

   let mobile_item_selec = '';
   let mobile_last_move = null;
   function positionMobile(ev) {
     mobile_last_move = ev;
   }

  function addNodeToDrawFlow(name, pos_x, pos_y) {
    pos_x = pos_x * ( editor.value.precanvas.clientWidth / (editor.value.precanvas.clientWidth * editor.value.zoom)) - (editor.value.precanvas.getBoundingClientRect().x * ( editor.value.precanvas.clientWidth / (editor.value.precanvas.clientWidth * editor.value.zoom)));
    pos_y = pos_y * ( editor.value.precanvas.clientHeight / (editor.value.precanvas.clientHeight * editor.value.zoom)) - (editor.value.precanvas.getBoundingClientRect().y * ( editor.value.precanvas.clientHeight / (editor.value.precanvas.clientHeight * editor.value.zoom)));
  
    const nodeSelected = listNodes.find(ele => ele.item == name);
    if (nodeSelected) {
      editor.value.addNode(name, nodeSelected.input,  nodeSelected.output, pos_x, pos_y, name, {}, name, 'vue');
    } else {
      console.error(`Node error: #{name}`);
    }
    
  }

  function getNodelist() {
    const exportdata = editor.value.export();
    return (exportdata && exportdata.drawflow && exportdata.drawflow.Home && Object.values(exportdata.drawflow.Home.data)) || [];
  }

  function getNodesOfType(type) {
    if (editor && editor.value && editor.value.export) {
      const nodes = getNodelist();
      const nodeObjs = Object.keys(nodes).map((key) => nodes[key]);
      const typeNodes =  nodeObjs.values().filter(node => node.class === type);
      return typeNodes;
    }
    return [];
  }

  function getNextKey(val) {
    const keys = val.map(v => (v.data && v.data.index) || 1);
    const sortedArr = [...keys].sort((a, b) => a - b);
    let lowest = 1;
    for (let i = 1; i < sortedArr.length +1; i++) {
      if (sortedArr[i] === lowest) {
        lowest++;
      } else if (sortedArr[i] > lowest) {
        return lowest;
      }
    }
    return lowest;
  }

  function renumberNodes() {
    listNodes.forEach(type => {
      const nodes = getNodesOfType(type.name);
        nodes.forEach((node, index) => {
          const itemIndex = index +1;
          const dataNode = editor.value.getNodeFromId(node.id);
          editor.value.updateNodeDataFromId(node.id, {index: itemIndex});
      })
    })
  }

  function getNodesByTypes() {
    let output = [];
    listNodes.forEach(t => {
      output.push({
        type: t.name,
        nodes: getNodesOfType(t.name),
      })
    })
    return output;  
  }

  function setSavedState() {
    const exportdata = editor.value.export();
    if (exportdata) {
      localStorage.setItem('fuelSystemGraph', JSON.stringify(exportdata));
      nodesByType.value = getNodesByTypes();
      lineList.value = extractInputs();
    }
  }

  // transforms the object format to MSFS config format
  function getConfigState() {
    const exportdata = editor.value.export();
    let inputs = [];
    let outputs = [];
    let connectionsSet = new Set();
    Object.entries(exportdata.drawflow.Home.data).forEach(([key,node]) => {
      const inp = getConnections(node.inputs);
      inp.forEach( i => {
        const line1 = {
          source: i.node,
          dest: key,
        }
        inputs.push(line1);
        connectionsSet.add(`${i.node}:${key}`);
      });
      const out = getConnections(node.outputs);
      out.forEach( o => {
        const line2 = {
          source: key,
          dest: o.node,
        }
        outputs.push(line2);
        connectionsSet.add(`${key}:${o.node}`);
      });
    });
    const lines = extractInputs();
    return lines;
    // return Array.from(connectionsSet);
  }

  function extractInputs() {
    const exportdata = editor.value.export();
    const df = exportdata.drawflow.Home.data;
    let inputs = [];
    Object.entries(df).forEach(([key,node]) => {
      const inp = getConnections(node.inputs);
      inp.forEach( i => {
        const src = df[i.node];
        const srcName = src.data.itemname || src.data.name ;
        const dest = df[key];
        const destName = dest.data.itemname || dest.data.name;
        const name = `${srcName}To${destName}`;
        const line1 = {
          name:name,
          source: srcName, 
          destination: destName,
          index: inputs.length +1,
          data: {},
        }
        inputs.push(line1);
      });
    });
    return inputs;
  }

  function getConnections(obj) {
    const connections = [];
    Object.entries(obj).forEach(([key, val]) => {
        if (val.connections && Array.isArray(val.connections)) {
            val.connections.forEach(connection => {
                if (connection.node) {
                    connections.push({
                        ...connection,
                    });                            
                } 
            });
        }
    });
    return connections;
  }


   onMounted(() => {

      var elements = document.getElementsByClassName('drag-drawflow');
      for (var i = 0; i < elements.length; i++) {
        elements[i].addEventListener('touchend', drop, false);
        elements[i].addEventListener('touchmove', positionMobile, false);
        elements[i].addEventListener('touchstart', drag, false );
      }
        
       const id = document.getElementById("drawflow");
       // Drawflow options
       editor.useuuid = true;

       editor.value = new Drawflow(id, Vue, internalInstance.appContext.app._context);
       editor.value.start();
      
       // associate the Vue components to drawflow nodes
       editor.value.registerNode('Tank', tankNode, {}, {});
       editor.value.registerNode('Pump', pumpNode, {}, {});
       editor.value.registerNode('Junction', junctionNode, {}, {});
       editor.value.registerNode('Valve', valveNode, {}, {});
       editor.value.registerNode('Engine', engineNode, {}, {});
       editor.value.registerNode('APU', apuNode, {}, {});
       editor.value.registerNode('Curve', curveNode, {}, {});
       editor.value.registerNode('Trigger', triggerNode, {}, {});

      editor.value.on('import', function(id) { 
        const importedData = editor.value.export();
        // console.error(importedData);
        setSavedState();
      });

      const savedData = localStorage.getItem('fuelSystemGraph');
      if (savedData) {
        // console.error(savedData)
        editor.value.import(JSON.parse(savedData));
      }

      editor.value.on('nodeCreated', function(id) {
        const dataNode = editor.value.getNodeFromId(id);
        const allNodes = getNodelist();
        const typeNodes = allNodes.filter(node => node.class === dataNode.class);
        const nextIndex = getNextKey(typeNodes);
        const nextName = `${dataNode.name}.${nextIndex}`;
        editor.value.updateNodeDataFromId(dataNode.id, {index: nextIndex, name: nextName });
        setSavedState();
      })
      editor.value.on('nodeDataChanged', function(id) {
        setSavedState();
      })
      editor.value.on('nodeRemoved', function(id) {
        setSavedState();
      })
      editor.value.on('nodeMoved', function(id) {
        setSavedState();
      })      
      editor.value.on('connectionCreated', function(id) {
        setSavedState();
      })
      editor.value.on('connectionRemoved', function(id) {
        setSavedState();
      })      
      // for debugging
      window.editor = editor.value;
      setSavedState();
  })

  return {
    exportEditor, exportConfig, listNodes, drag, drop, allowDrop, dialogVisible, dialogData, getNodesOfType, nodesByType, lineList, copyToClipboard, clearNodes, clearConfirm, importDialog, importField, importConfigField, doImport, doConfigImport, importError, closeImport,
  }

  }
}

</script>
<style scoped>
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #494949;
}
.container {
    min-height: calc(100vh - 100px);
}
.column {
    border-right: 1px solid #494949;
}
.column ul {
    padding-inline-start: 0px;
    padding: 10px 10px;
 
}
.column li {
    background: transparent;
}

.node {
    border-radius: 7px;
    border: 2px solid #494949;
    display: block;
    height:35px;
    line-height:25px;
    padding: 5px 10px;
    margin: 10px 0px;
    cursor: move;
    border-color: #494949 #111 #111 #494949;
}
.node.Tank {
  background: var(--tank-color);
}
.node.Pump {
  background: var(--pump-color);
}
.node.Junction {
  background: var(--junction-color);
}
.node.Valve {
  background: var(--valve-color);
}
.node.Engine {
  background: var(--engine-color);
}
.node.Curve {
  background: var(--curve-color);
}
.node.APU {
  background: var(--apu-color);
}
.node.Trigger {
  background: var(--trigger-color);
}


.error {
  color: #e60707;
  font-weight: bold;
}

.sidebar {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 100px);
  overflow: hidden;
}

.node-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border-radius: 3px;
  margin-bottom: 12px;
  scrollbar-width: auto;
  scrollbar-color: #8c8c8c #383838;  
}

  node-list::-webkit-scrollbar {
    width: 16px;
  }
  node-list::-webkit-scrollbar-track {
    background: #383838;
  }
  node-list::-webkit-scrollbar-thumb {
    background-color: #8c8c8c;
    border-radius: 10px;
    border: 3px solid #121212;
  }


pre  {
  background: var(--gray);
  color: #E5E5E5;
  padding: 12px;
  max-height: 70vh;
}

pre code {
  font-family:  monospace; 
}

#drawflow {
  width: 100%;
  height: 100%;
  text-align: initial;
  background: #2b2c30;
  background-size: 20px 20px;
  background-image: radial-gradient(#494949 1px, transparent 1px);
  
}
</style>