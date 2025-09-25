<template>
    <div ref="el" class="line-config">
        <div class="line-heading">{{itemName}}</div>
      <el-form
        label-width="auto"
      >
        <div ref="properties">   
            <el-form-item label="Fuel Flow 1psi" label-position="left">
                <el-input v-model="fuelFlow" df-fuelflow size="small" @change="update"></el-input>
            </el-form-item>
            <el-form-item label="Volume" label-position="left">
                <el-input v-model="volume" df-volume size="small" @change="update"></el-input>
            </el-form-item> 
            <el-form-item label="Gravity Flow" label-position="left">
                <el-input v-model="gravityFlow" df-gravityflow size="small" @change="update"></el-input>
            </el-form-item>                        
        </div>
        </el-form>
        <div class="button-bar">
            <el-button plain @click="closeDialog">OK</el-button>
        </div>
    </div>
</template>

<script>
import { defineComponent, onMounted, getCurrentInstance, readonly, ref, nextTick, watchEffect } from 'vue'

export default {
    props: [
        'lineData'
    ],
    emits: ['update', 'closed'],
    setup(props, { emit }) {
        const el = ref(null);
        const nodeId = ref(0);
        const dataModel = ref({});
        const itemName = ref('');
        const fuelFlow = ref('0');
        const volume = ref('0');
        const gravityFlow = ref('0'); 

        watchEffect(() => {
            dataModel.value = props.lineData;
            itemName.value = dataModel.value.itemname || 'Unknown Line';
            fuelFlow.value = dataModel.value.fuelflow || '';
            volume.value = dataModel.value.volume || '' || '';
            gravityFlow.value = dataModel.value.gravityflow || '';            
        });

        function closeDialog() {
            emit('closed');
        }

        function update() {
            dataModel.value.itemname = itemName.value;
            dataModel.value.fuelflow = fuelFlow.value;
            dataModel.value.volume = volume.value;
            dataModel.value.gravityflow = gravityFlow.value;
            emit('update', dataModel.value);
        }
        
        return {
            el, itemName, fuelFlow, volume, gravityFlow, dataModel, update, closeDialog
        }

    }    
    
}
</script>
