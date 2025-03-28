<template>
    <div ref="el">
        <nodeHeader nodeType="Curve" :index="itemIndex"/>
      <el-form
        label-width="auto"
      >
        <div ref="properties">
            <el-form-item label="Params" label-position="left">
                <el-input v-model="params" df-params :rows="2" type="textarea" size="small"></el-input>
            </el-form-item>
            <div class="graph" ref="graph"></div>
        </div>
    </el-form>
    </div>
</template>

<script>
import { defineComponent, onMounted, getCurrentInstance, readonly, ref, nextTick,useTemplateRef, watch, } from 'vue'
import nodeHeader from './nodeHeader.vue'

const defaultCurve = '0:0, 0.5:0.5, 1:1';

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
        const params = ref(defaultCurve);
        const graph = useTemplateRef('graph');

        watch(params, async () => {
          drawPath();
        })

        const createSmoothPath = (data, w, h, smoothing = 0.1) => {
            if (data.length < 2) {
                return '';
            }
            const coord = data.map( p => ({x: p.x * w, y: (p.y * -h) + h}));
            let pathData = `M ${coord[0].x},${coord[0].y}`;
            for (let i = 1; i < coord.length; i++) {
                const pStart = coord[i - 1];
                const pEnd = coord[i];
                const pPrev = coord[i - 2] || pStart;
                const pNext = coord[i + 1] || pEnd;
        
                const cpsX = pStart.x + (smoothing * (pEnd.x - pPrev.x));
                const cpsY = pStart.y + (smoothing * (pEnd.y - pPrev.y));
                const cpeX = pEnd.x - (smoothing * (pNext.x - pStart.x));
                const cpeY = pEnd.y - (smoothing * (pNext.y - pStart.y));
                pathData += ` C ${cpsX},${cpsY} ${cpeX},${cpeY} ${pEnd.x},${pEnd.y}`;
            }
            return pathData;
        }

        const createSVGPath = (data) => {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            const w = 200;
            const h = 200;
            svg.setAttribute('width', w);
            svg.setAttribute('height', h);

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', createSmoothPath(data, w, h));
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', '#E2E2E2');
            path.setAttribute('stroke-width', '2px');

            svg.appendChild(path);
            return svg;     
        }


        const drawPath = () => {
           if (graph.value && params.value) {
                const svg = createSVGPath(convertParams(params.value));
                graph.value.innerHTML = '';
                graph.value.appendChild(svg);
           }
        }

        const convertParams = (params) => {
            return params.split(',').map(d => {
                const coords = d.trim().split(':');
                return {y: parseFloat(coords[1]), x: parseFloat(coords[0])}; 
            });
        }

        df = getCurrentInstance().appContext.config.globalProperties.$df.value;
    
        onMounted(async () => {
            await nextTick()
            nodeId.value = el.value.parentElement.parentElement.id.slice(5)
            dataNode.value = df.getNodeFromId(nodeId.value)
            
            itemIndex.value = dataNode.value.data.index;
            params.value = dataNode.value.data.params || defaultCurve;
            nextTick( () => {
                const data = { params: params.value, ...dataNode.value.data };
                df.updateNodeDataFromId(nodeId.value, data);
            });

            drawPath();
        });
        
        return {
            el,  itemIndex, params, graph,
        }

    }    
    
})
</script>
<style scoped>
.graph {
    width: 200px;
    height: 200px;
    margin: auto;
    margin-top: 12px;
    background: #121212;
}

</style>