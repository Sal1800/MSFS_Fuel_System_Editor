<template>
    <div ref="el">
        <nodeHeader  :title="itemName" nodeType="Junction" :index="itemIndex"/>
      <el-form
        label-width="auto"
      >
        
        <div ref="properties">
            <el-form-item label="Name" label-position="left">
                <el-input v-model="itemName" df-itemname  size="small"></el-input>
            </el-form-item>
            <el-form-item label="Title" label-position="left">
                <el-input v-model="itemTitle" df-itemtitle size="small"></el-input>
            </el-form-item>
            <el-form-item label="Options"  v-for="(option, index) in optionList" label-position="top">
                <el-select
                  v-model="optionList[index]"
                  multiple
                  placeholder="Select"
                  style="width: 100%"
                  @change="setOption"
                >
                  <el-option
                    v-for="item in lineOptions"
                    :key="item.name"
                    :label="item.name"
                    :value="item.name"
                  />
                </el-select>
            </el-form-item> 
            <!-- <div v-for="item in lineOptions">{{item.node}}</div> -->
            <div class="new-option">
              <el-button circle @click="newOption">
                <el-icon size="32">
                  <CirclePlus />
                </el-icon>
              </el-button>
            </div>
            <div class="oneway-list">
              <div class="el-form-item__label">One-Way Lines</div>
              <div class="card">
                <el-checkbox :checked="line.oneWay" :label="line.name" @change="setOneWay" v-for="line,index in oneWayList" />
              </div>
            </div>
        </div>
    </el-form>
    </div>
</template>

<script>
import { defineComponent, onMounted, getCurrentInstance, readonly, ref, nextTick, computed, defineProps} from 'vue'
import nodeHeader from './nodeHeader.vue'

export default defineComponent({
    components: {
        nodeHeader
    },
    setup() {
        const el = ref(null);
        const nodeId = ref(0);
        let df = null
        const dataNode = ref({});
        const itemIndex = ref('');
        const itemName = ref('');
        const itemTitle = ref('');
        const optionList = ref([]);
        const connections = ref([]);
        const info = ref('');
        const oneWayList = ref([]);

        df = getCurrentInstance().appContext.config.globalProperties.$df.value;

        /* Computed var returns an array of line names */
        const lineOptions = computed(() => {
            return connections.value;
        })

        const newOption = (event) => {
            optionList.value.push([]);
        }

        const setOption = (val) => {
            nextTick( () => {
                const data = { ...dataNode.value.data, optionlist: optionList.value };
                df.updateNodeDataFromId(nodeId.value, data);
            });
        }

        const setOneWay = (state, e) => {
            const line = oneWayList.value.find(i => i.name === e?.target?.value);
            if (line) {
                line.oneWay = state;
            }
            nextTick( () => {
                // filter list to only contain the names of the one-way lines
                const onewaylist = oneWayList.value.filter(i => i.oneWay).map(i => i.name)
                const data = { ...dataNode.value.data, onewaylist };
                df.updateNodeDataFromId(nodeId.value, data);
            });
        }

        const setOneWayList = (dataList = []) => {
          if (oneWayList.value.length) {
            connections.value.forEach(c => {
              const line = oneWayList.value.find(k => k.name === c.name);
              if (!line) {
                oneWayList.value.push({ name:c.name, oneWay: false });
              }
            });
            // remove lines no longer in connections   
            const connectionNames = connections.value.map(c => c.name);
            oneWayList.value = oneWayList.value.filter(i => connectionNames.includes(i.name));   
          } else {
            oneWayList.value = [...connections.value].map(c => ({ name:c.name, oneWay: dataList.includes(c.name) }));
          }

        }

        const getConnections = () => {
            // if (!df.data) return { connections: [] };
            const selfNode = df.getNodeFromId(nodeId.value);
            const selfName = selfNode.data.itemname || selfNode.data.name;
            const io = {...selfNode.inputs, ...selfNode.outputs};
            const connections = [];
            let inputCount = 0;
            let inputsUsed = 0;
            let outputCount = 0;
            let outputsUsed = 0;            
            Object.entries(io).forEach(([ioKey, ioValue]) => {
                if (ioValue.connections && Array.isArray(ioValue.connections)) {
                    if (ioKey.indexOf('input') != -1) {
                        inputCount += 1;
                    } else {
                        outputCount += 1;
                    }
                    ioValue.connections.forEach(connection => {
                        if (connection.node) {
                            const isInput = ioKey.indexOf('input') != -1;
                            const ioNode = df.getNodeFromId(connection.node);
                            const nodeName = ioNode.data.itemname || ioNode.data.name;
                            connections.push({
                                name: isInput ? `${nodeName}To${selfName}` : `${selfName}To${nodeName}`,
                                ...connection,
                            });
                            if (isInput) {
                                inputsUsed += 1;
                            } else {
                                outputsUsed += 1;
                            }                                           
                        } 
                    });
                }
            });
            const obj = {
                connections,
                inputCount,
                inputsUsed,
                outputCount,
                outputsUsed,
            }
            // console.error(obj);
            return obj;
        }

        df.on('nodeDataChanged', (id) => {
            connections.value = getConnections().connections;
            setOneWayList();
        });

        df.on('connectionCreated', ({ output_id, input_id, output_class, input_class }) => {
            if (output_id === nodeId.value || input_id === nodeId.value) {
                const selfNode = df.getNodeFromId(nodeId.value);
                const selfCon = getConnections();
                connections.value = selfCon.connections;
                if (selfCon.inputCount === selfCon.inputsUsed || selfCon.inputCount === 0) {
                    df.addNodeInput(nodeId.value);
                }
                if (selfCon.outputCount === selfCon.outputsUsed || selfCon.outputCount === 0) {
                    df.addNodeOutput(nodeId.value);
                }
                setOneWayList();
            }
        })
        df.on('connectionRemoved', ({ output_id, input_id, output_class, input_class }) => {
            if (output_id === nodeId.value || input_id === nodeId.value) {
                const selfNode = df.getNodeFromId(nodeId.value);
                const selfCon = getConnections();
                connections.value = selfCon.connections;
                if (output_id === nodeId.value && selfCon.outputCount > 1) {
                    df.removeNodeOutput(output_id, output_class);
                } else if(selfCon.inputCount > 1) {
                    df.removeNodeInput(input_id, input_class);
                }
                setOneWayList();
            }
        })

        onMounted(async () => {
            await nextTick()

            nodeId.value = el.value.parentElement.parentElement.id.slice(5)
            dataNode.value = df.getNodeFromId(nodeId.value)

            connections.value = getConnections().connections;
            itemIndex.value = dataNode.value.data.index;
            itemName.value = dataNode.value.data.itemname;
            itemTitle.value = dataNode.value.data.itemtitle;
            const optionData = dataNode.value.data.optionlist;
            if (optionData) {
               optionList.value = optionData.filter(opt => opt.length);
               setOption(); 
            } else {
               newOption(); // create one option 
            }
            // import inputonlylines and outputonlylines
            const inputonlylines = dataNode.value.data.inputonlylines || [];
            const outputonlylines = dataNode.value.data.outputonlylines || [];
            let onewaylist = (inputonlylines.length || outputonlylines.length) ? [...inputonlylines, ...outputonlylines] : dataNode.value.data.onewaylist;
            setOneWayList(onewaylist);

        });
        
        return {
            el, itemIndex, itemName, itemTitle, optionList
            , lineOptions, info, connections, newOption, setOption, oneWayList, setOneWay,
        }

    }    
    
})
</script>

<style scoped>
.new-option {
    text-align: right;
    padding-top: 6px;
}
.new-option .el-button {
    background: transparent;
    border: none;
}

.card {
  background-color: var(--el-fill-color-blank);
  border-radius: var(--el-border-radius-base);
  box-shadow: 0 0 0 1px var(--el-border-color) inset;
  box-sizing: border-box;
  overflow: hidden;
}
.el-checkbox {
  padding: 4px 8px;
}
.card {
  font-size: 12px;
}

</style>

<style>
.drawflow-node.Junction .card .el-checkbox__label {
    font-size: 12px;
    color: #656565;
  }
.drawflow-node.Junction .card .el-checkbox__input.is-checked+.el-checkbox__label {
    color: #000;  
}

</style>