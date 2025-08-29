<template>
    <div ref="el">
        <nodeHeader nodeType="Trigger" :index="itemIndex"/>
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
            <el-form-item label="Condition" label-position="left">
                <el-input v-model="condition" df-condition size="small"></el-input>
            </el-form-item>           
            <el-form-item label="Effect True" label-position="left">
                <el-input v-model="effectTrue" df-effecttrue :rows="2" type="textarea" size="small"></el-input>
            </el-form-item>
            <el-form-item label="Effect False" label-position="left">
                <el-input v-model="effectFalse" df-effectfalse :rows="2" type="textarea" size="small"></el-input>
            </el-form-item>            
            <el-form-item label="Target" label-position="left">
                <el-input v-model="target" df-target size="small"></el-input>
            </el-form-item>
            <el-form-item label="Target Index" label-position="left">
                <el-input v-model="targetIndex" df-targetindex size="small"></el-input>
            </el-form-item>                
            <el-form-item label="Threshold" label-position="left">
                <el-input v-model="threshold" df-threshold size="small"></el-input>
            </el-form-item>
            <el-form-item label="Delay False" label-position="left">
                <el-input v-model="delayFalse" df-delayfalse size="small"></el-input>
            </el-form-item>
            <el-form-item label="Delay True" label-position="left">
                <el-input v-model="delayTrue" df-delaytrue size="small"></el-input>
            </el-form-item> 
            <el-form-item label="iParam" label-position="left">
                <el-input v-model="iParam" df-iparam size="small"></el-input>
            </el-form-item>                                                  
            
        </div>
    </el-form>
    </div>
</template>

<script>
import { defineComponent, onMounted, getCurrentInstance, readonly, ref, nextTick,useTemplateRef, watch, } from 'vue'
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
        const condition = ref('');
        const target = ref('');
        const targetIndex = ref('');
        const threshold = ref(0);
        const delayTrue = ref(0);
        const delayFalse = ref(0);
        const effectTrue = ref('');
        const effectFalse = ref('');
        const iParam = ref('');

        df = getCurrentInstance().appContext.config.globalProperties.$df.value;
    
        onMounted(async () => {
            await nextTick()
            nodeId.value = el.value.parentElement.parentElement.id.slice(5)
            dataNode.value = df.getNodeFromId(nodeId.value)
            
            itemIndex.value = dataNode.value.data.index;
            itemName.value = dataNode.value.data.itemname;
            itemTitle.value = dataNode.value.data.itemtitle;
            condition.value = dataNode.value.data.condition;
            target.value = dataNode.value.data.target;
            targetIndex.value = dataNode.value.data.targetindex;
            threshold.value = dataNode.value.data.threshold;
            delayTrue.value = dataNode.value.data.delaytrue;
            delayFalse.value = dataNode.value.data.delayfalse;
            effectTrue.value = dataNode.value.data.effecttrue;
            effectFalse.value = dataNode.value.data.effectfalse;
            iParam.value = dataNode.value.data.iparam;

        });
        
        return {
            el,  itemIndex, itemName, itemTitle, condition, target, targetIndex, threshold, delayTrue, delayFalse, effectTrue, effectFalse, iParam 
        }

    }    
    
})
</script>
<style scoped>


</style>