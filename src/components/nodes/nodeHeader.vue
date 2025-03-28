<template>
    <div class="header">
    	<div v-if="title">{{title}}</div>
    	<div v-if="nodeType || index">{{nodeType}}.{{index}}</div>
    </div>
</template>
<script>
import { defineComponent } from 'vue'

export default defineComponent({
    props: ['title', 'nodeType', 'index'],
})
</script>


<style scoped>
	.header {
		display: flex;
		justify-content: space-between;
	    background: #494949;
	    margin-top: -15px;
	    margin-left: -15px;
	    margin-right: -15px;
	    padding: 10px 15px;
	    margin-bottom: 15px;
	}
</style>