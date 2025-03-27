// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite( bgImg, fgImg, fgOpac, fgPos )
{   /*******************
    *  Alpha-Blending  *
    ********************/
    
    //bgImg and fgImg are HTMLImagesElement 

    //dimension details
    const bg_w=bgImg.width;
    const bg_h=bgImg.height;
    const fg_w=fgImg.width;
    const fg_h=fgImg.height;
    console.log(`Dimensions of bgImg ${bg_w}, ${bg_h}`);
    console.log(`Dimensions of fgImg ${fg_w}, ${fg_h}`);

    if(fgPos.x == 0 && fgPos.y==0){
        console.log(`Images are aligned at the left corner`);
    }
    // Position of the left corner of fgImg
    const fg_x=fgPos.x;
    const fg_y=fgPos.y;

    console.log(`Dimensions of bgImg ${bg_w}, ${bg_h}`);
    console.log(`The position with respect to the left corner is ${fg_x},${fg_y}`);

    // I want to access the pixels , fist thing first  I have to get the arrays
    const bg_data=bgImg.data;
    const fg_data=fgImg.data;
    
    for(let y=0; y<fg_h ;y++){
        for( let x=0; x<fg_w ;x++){
            const on_bg_y= y +fg_y;
            const on_bg_x= x +fg_x;
            const arr_index_fg= ((y*fg_w)+x)*4; // Multiplication for 4 because a pixel has 4 values

            //checking if the pixel is inside the region of the bgImage or outside
            if(on_bg_x<bg_w && on_bg_x>=0 && on_bg_y>=0 && on_bg_y<bg_h){
                //the pixel is inside
                const arr_index_bg= ((on_bg_y*bg_w)+on_bg_x)*4;
                //now we are ready for alpha-blending

                //values for bgImg
                const bg_R=bg_data[arr_index_bg];
                const bg_G=bg_data[arr_index_bg+1];
                const bg_B=bg_data[arr_index_bg+2];
                const bg_a=bg_data[arr_index_bg+3]/255;

                //values for fgImg
                const fg_R=fg_data[arr_index_fg];
                const fg_G=fg_data[arr_index_fg+1];
                const fg_B=fg_data[arr_index_fg+2];
                const fg_a=(fg_data[arr_index_fg+3]/255)*fgOpac;

                //formula
                const out_alpha= fg_a + bg_a *(1-fg_a);
                if (out_alpha > 0) {
                    bg_data[arr_index_bg]     = (fg_R * fg_a + bg_R * bg_a * (1 - fg_a)) / out_alpha;
                    bg_data[arr_index_bg + 1] = (fg_G * fg_a + bg_G * bg_a * (1 - fg_a)) / out_alpha;
                    bg_data[arr_index_bg + 2] = (fg_B * fg_a + bg_B * bg_a * (1 - fg_a)) / out_alpha;
                    bg_data[arr_index_bg + 3] = out_alpha * 255;
                }


                
            }
            //the pixel is not inside
            //so I don't care...I will display backgroung pixel.

        }
    }

    


}
