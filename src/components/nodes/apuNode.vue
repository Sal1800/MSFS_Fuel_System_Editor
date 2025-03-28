<template>
    <div ref="el">
        <nodeHeader :title="itemName" nodeType="APU" :index="itemIndex"/>
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
            <el-form-item label="Fuel Burn Rate" label-position="left">
                <el-input v-model="fuelBurn" df-fuelburn size="small"></el-input>
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
        const fuelBurn = ref('0');

        df = getCurrentInstance().appContext.config.globalProperties.$df.value;

        onMounted(async () => {
            await nextTick()
            nodeId.value = el.value.parentElement.parentElement.id.slice(5)
            dataNode.value = df.getNodeFromId(nodeId.value)
            
            itemName.value = dataNode.value.data.itemname;
            itemTitle.value = dataNode.value.data.itemtitle;
            itemIndex.value = dataNode.value.data.index;
            fuelBurn.value = dataNode.value.data.fuelburn;
        });
        
        return {
            el, itemName, itemTitle, itemIndex, fuelBurn,
        }

    }    
    
})
</script>
