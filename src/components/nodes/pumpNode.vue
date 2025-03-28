<template>
    <div ref="el">
        <nodeHeader :title="itemName" nodeType="Pump" :index="itemIndex"/>
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
            <el-form-item label="Pressure" label-position="left">
                <el-input v-model="pressure" df-pressure size="small"></el-input>
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
            <el-form-item label="Tank Reqd" label-position="left">
                <el-input v-model="tankFuelRequired" df-tankfuelrequired size="small"></el-input>
            </el-form-item> 
            <el-form-item label="Type" label-position="left">
                <el-select v-model="pumpType" @change="selectPumpType" placeholder="Select">
                  <el-option
                    v-for="item in pumpTypeOptions"
                    :key="item"
                    :label="item"
                    :value="item"
                  />
                </el-select>
            </el-form-item> 
            <el-form-item label="Circuit Index" label-position="left">
                <el-input v-model="circuitIndex" df-circuitindex size="small"></el-input>
            </el-form-item>
            <el-form-item label="Auto" label-position="left">
                <el-input v-model="autoCondition" df-autocondition size="small"></el-input>
            </el-form-item>
            <el-form-item label="Pressure Dec" label-position="left">
                <el-input v-model="pressureDecrease" df-pressuredecrease size="small"></el-input>
            </el-form-item>            
        </div>
    </el-form>
    </div>
</template>

<script>
import { defineComponent, onMounted, getCurrentInstance, readonly, ref, nextTick, } from 'vue'
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
        const itemName = ref('');
        const itemTitle = ref('');
        const itemIndex = ref('');
        const pressure = ref(0);
        const tankFuelRequired = ref(0);
        const pumpType = ref('');
        const curve = ref('');
        const autoCondition = ref('False');
        const circuitIndex = ref('1');
        const pressureDecrease = ref('');
        const curveList = ref([]);

        const pumpTypeOptions = readonly(['Electric','APUDriven','EngineDriven','Manual','Anemometer']);
        const selectPumpType = () => {
            nextTick( () => {
                const data = { pumptype: pumpType.value, ...dataNode.value.data };
                df.updateNodeDataFromId(nodeId.value, data);
            });
        }

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
            
            itemName.value = dataNode.value.data.itemname;
            itemTitle.value = dataNode.value.data.itemtitle;
            itemIndex.value = dataNode.value.data.index;
            pressure.value = dataNode.value.data.pressure;
            tankFuelRequired.value = dataNode.value.data.tankfuelrequired;
            curve.value = dataNode.value.data.curve;
            pumpType.value = dataNode.value.data.pumptype;
            autoCondition.value = dataNode.value.data.autocondition;
            circuitIndex.value = dataNode.value.data.circuitindex;
            pressureDecrease.value = dataNode.value.data.pressuredecrease;

            getCurves();
        });
        
        return {
            el, itemName, itemTitle, itemIndex, pressure, tankFuelRequired, curve, autoCondition, circuitIndex, pumpType, pumpTypeOptions, selectPumpType, pressureDecrease, curveList, setOption
        }

    }    
    
})
</script>
