<template>
    <div ref="el">
        <nodeHeader :title="itemName" nodeType="Tank" :index="itemIndex"/>
      <el-form
        label-width="auto"
      >
        
        <div ref="properties">
            <el-form-item label="Name" label-position="left">
                <el-input v-model="itemName" df-itemName  size="small"></el-input>
            </el-form-item>
            <el-form-item label="Title" label-position="left">
                <el-input v-model="itemTitle" df-itemTitle size="small"></el-input>
            </el-form-item>
            <el-form-item label="Capacity" label-position="left">
                <el-input v-model="capacity" df-capacity size="small"></el-input>
            </el-form-item>
            <el-form-item label="Unusuable" label-position="left">
                <el-input v-model="unusuableCapacity" df-unusablecapacity size="small"></el-input>
            </el-form-item>
            <el-form-item label="Curve" label-position="left">
                <el-select
                  v-model="curve"
                  placeholder="Select"
                  style="width: 100%"
                  clearable
                  @change="setOption"
                >
                  <el-option
                    v-for="item in curveList"
                    :key="item"
                    :label="item.name"
                    :value="item.index"
                  />
                </el-select>
            </el-form-item>
            <el-form-item label="Position" label-position="left">
                <el-input v-model="position" df-position size="small"></el-input>
            </el-form-item>
            <el-form-item label="Drop Timer" label-position="left">
                <el-input v-model="droptimer" df-droptimer size="small"></el-input>
            </el-form-item>            
            <el-form-item label="Priority" label-position="left">
                <el-input v-model="priority" df-priority size="small"></el-input>
            </el-form-item>
        </div>
    </el-form>
    </div>
</template>

<script>
import { defineComponent, onMounted, getCurrentInstance, readonly, ref, nextTick,} from 'vue'
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
        const capacity = ref(0);
        const unusuableCapacity = ref(0);
        const curve = ref('');
        const curveList = ref([]);
        const droptimer = ref('');
        const position = ref('0,0,0');
        const priority = ref('1');

        const setOption = () => {
            nextTick( () => {
                const data = { curve: curve.value, ...dataNode.value.data };
                df.updateNodeDataFromId(nodeId.value, data);
            });
        }

        const getCurves = () => {
            const exportdata = df.export();
            const curves = Object.entries(exportdata.drawflow.Home.data).filter(([key,node]) => node.class === 'Curve');
            if (curves) {
                curveList.value = curves.map(([k,c]) => ({name:c.data.name, index: c.data.index}));
            }
        }


        df = getCurrentInstance().appContext.config.globalProperties.$df.value;
    
        onMounted(async () => {
            await nextTick()
            nodeId.value = el.value.parentElement.parentElement.id.slice(5)
            dataNode.value = df.getNodeFromId(nodeId.value)

            df.on('nodeCreated', getCurves);
            df.on('nodeRemoved', getCurves);         
            
            itemIndex.value = dataNode.value.data.index;
            itemName.value = dataNode.value.data.itemname;
            itemTitle.value = dataNode.value.data.itemtitle;
            capacity.value = dataNode.value.data.capacity;
            unusuableCapacity.value = dataNode.value.data.unusablecapacity;
            curve.value = dataNode.value.data.curve;
            position.value = dataNode.value.data.position;
            priority.value = dataNode.value.data.priority;

            getCurves();
        });
        
        return {
            el, itemIndex, itemName, itemTitle, capacity, unusuableCapacity, curve, position, priority, droptimer, curveList
        }

    }    
    
})
</script>
