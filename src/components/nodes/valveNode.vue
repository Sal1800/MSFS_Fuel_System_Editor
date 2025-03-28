<template>
    <div ref="el">
        <nodeHeader :title="itemName" nodeType="Valve" :index="itemIndex"/>
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
            <el-form-item label="One Way" label-position="left">
                  <el-switch
                    v-model="oneWay"
                    @change="setOption"
                    class="ml-2"
                    style="--el-switch-on-color: #7f449e; --el-switch-off-color: #737373"
                  />
            </el-form-item>
            <el-form-item label="Opening Time" label-position="left">
                <el-input v-model="openingTime" df-openingTime size="small"></el-input>
            </el-form-item>            
            <el-form-item label="Circuit Index" label-position="left">
                <el-input v-model="circuitIndex" df-circuitIndex size="small"></el-input>
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
        const openingTime = ref('');
        const oneWay = ref(true);
        const circuitIndex = ref('1');

        df = getCurrentInstance().appContext.config.globalProperties.$df.value;
    
        const setOption = (val) => {
            nextTick( () => {
                const data = { oneway: oneWay.value, ...dataNode.value.data };
                df.updateNodeDataFromId(nodeId.value, data);
            });
        }

        onMounted(async () => {
            await nextTick()
            nodeId.value = el.value.parentElement.parentElement.id.slice(5)
            dataNode.value = df.getNodeFromId(nodeId.value)
            
            itemName.value = dataNode.value.data.itemname;
            itemTitle.value = dataNode.value.data.itemtitle;
            itemIndex.value = dataNode.value.data.index;
            oneWay.value = dataNode.value.data.oneway;
            circuitIndex.value = dataNode.value.data.circuitindex;
            openingTime.value = dataNode.value.data.openingtime;
        });
        
        return {
            el, itemName, itemTitle, itemIndex, oneWay, circuitIndex, openingTime, setOption
        }

    }    
    
})
</script>
